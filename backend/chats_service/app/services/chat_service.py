import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.repositories.chats import ChatsRepository
from app.repositories.messages import MessagesRepository
from app.services.llm_service import LLMConfig, LLMMessage, LLMRouter
from app.clients.repos_service import ReposServiceClient, RepoNotFoundError
from app.clients.ingestion_service import IngestionServiceClient


def _format_rag(chunks: list[dict]) -> str:
    parts = []
    for i, c in enumerate(chunks, 1):
        path = c.get("file_path") or "unknown"
        lang = c.get("language") or ""
        score = c.get("score", 0.0)
        start = c.get("start_code_line")
        end = c.get("end_code_line")
        loc = f" lines {start}-{end}" if start is not None and end is not None else ""
        header = f"[{i}] {path}{loc} ({lang}) score={score:.3f}"
        body = c.get("body") or ""
        parts.append(header + "\n" + body)
    return "\n\n---\n\n".join(parts)


class ChatService:
    def __init__(self, llm: LLMRouter, repos_client: ReposServiceClient, ingest_client: IngestionServiceClient) -> None:
        self.chats = ChatsRepository()
        self.messages = MessagesRepository()
        self.llm = llm
        self.repos = repos_client
        self.ingest = ingest_client

    async def create_chat(self, db: AsyncSession, *, repo_id: int, user_id: int):
        # validate repo exists via repos_service
        await self.repos.ensure_repo_exists(repo_id, user_id)

        chat = await self.chats.create(db, repo_id=repo_id, user_id=user_id)
        await db.commit()
        return chat

    async def get_chat(self, db: AsyncSession, chat_id: uuid.UUID):
        return await self.chats.get(db, chat_id)

    async def list_chats(self, db: AsyncSession, *, user_id: int, repo_id: int | None, limit: int, offset: int):
        return await self.chats.list(db, user_id=user_id, repo_id=repo_id, limit=limit, offset=offset)

    async def list_messages(self, db: AsyncSession, chat_id: uuid.UUID, *, limit: int, offset: int):
        return await self.messages.list_for_chat(db, chat_id, limit=limit, offset=offset)

    async def send_message(self, db: AsyncSession, *, chat_id: uuid.UUID, content: str):
        chat = await self.chats.get(db, chat_id)
        if not chat:
            raise ValueError("chat not found")

        # 1) index state -> collection
        idx = await self.repos.get_index_state(user_id=chat.user_id, repository_id=chat.repo_id)
        if idx.get("status") != "done":
            raise ValueError(f"repository is not indexed yet (status={idx.get('status')})")
        collection = idx["qdrant_collection"]

        # 2) rag search via ingestion_service
        rag = await self.ingest.rag_search(collection=collection, query=content, top_k=settings.rag_top_k)
        rag_text = _format_rag(rag.get("chunks", []))

        # 3) history
        history = await self.messages.last_n_for_context(db, chat_id, settings.llm_history_limit)

        ctx: list[LLMMessage] = []
        sys_prompt = settings.llm_default_system_prompt
        ctx.append(LLMMessage(role="system", content=sys_prompt))

        # repo context
        ctx.append(LLMMessage(
            role="system",
            content=(
                "Answer using ONLY the repository context below. "
                "If the answer is not in the context, say you don't know.\n\n"
                f"{rag_text}"
            ),
        ))

        for m in history:
            ctx.append(LLMMessage(role=m.role, content=m.content))

        cfg = LLMConfig(
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
        )

        llm_resp = await self.llm.generate(prompt=content, config=cfg, context=ctx)

        # закрываем implicit транзакцию после SELECT'ов
        await db.rollback()

        async with db.begin():
            user_msg = await self.messages.create(db, chat_id=chat_id, role="user", content=content)
            assistant_msg = await self.messages.create(db, chat_id=chat_id, role="assistant", content=llm_resp.text)

        return user_msg, assistant_msg, llm_resp

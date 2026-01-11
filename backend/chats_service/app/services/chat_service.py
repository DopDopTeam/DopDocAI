import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.repositories.chats import ChatsRepository
from app.repositories.messages import MessagesRepository
from app.services.llm_service import LLMConfig, LLMMessage, LLMRouter
from app.clients.repos_service import ReposServiceClient, RepoNotFoundError


class ChatService:
    def __init__(self, llm: LLMRouter, repos_client: ReposServiceClient) -> None:
        self.chats = ChatsRepository()
        self.messages = MessagesRepository()
        self.llm = llm
        self.repos = repos_client

    async def create_chat(self, db: AsyncSession, *, repo_id: int, user_id: int):
        # validate repo exists via repos_service
        await self.repos.ensure_repo_exists(repo_id)

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

        history = await self.messages.last_n_for_context(db, chat_id, settings.llm_history_limit)

        ctx: list[LLMMessage] = []
        if settings.default_system_prompt:
            ctx.append(LLMMessage(role="system", content=settings.default_system_prompt))

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

        # persist both messages atomically
        async with db.begin():
            user_msg = await self.messages.create(db, chat_id=chat_id, role="user", content=content)
            assistant_msg = await self.messages.create(db, chat_id=chat_id, role="assistant", content=llm_resp.text)

        return user_msg, assistant_msg, llm_resp

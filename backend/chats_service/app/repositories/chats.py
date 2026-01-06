import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Chat


class ChatsRepository:
    async def create(self, db: AsyncSession, *, repo_id: int, user_id: int) -> Chat:
        chat = Chat(repo_id=repo_id, user_id=user_id)
        db.add(chat)
        await db.flush()  # получаем chat.id
        return chat

    async def get(self, db: AsyncSession, chat_id: uuid.UUID) -> Chat | None:
        res = await db.execute(select(Chat).where(Chat.id == chat_id))
        return res.scalar_one_or_none()

    async def list(self, db: AsyncSession, *, user_id: int, repo_id: int | None, limit: int, offset: int) -> list[Chat]:
        q = select(Chat).where(Chat.user_id == user_id).order_by(Chat.created_at.desc())
        if repo_id is not None:
            q = q.where(Chat.repo_id == repo_id)
        q = q.limit(limit).offset(offset)
        res = await db.execute(q)
        return list(res.scalars().all())

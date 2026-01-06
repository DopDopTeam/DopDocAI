import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Message


class MessagesRepository:
    async def create(self, db: AsyncSession, *, chat_id: uuid.UUID, role: str, content: str) -> Message:
        msg = Message(chat_id=chat_id, role=role, content=content)
        db.add(msg)
        await db.flush()
        return msg

    async def list_for_chat(self, db: AsyncSession, chat_id: uuid.UUID, *, limit: int, offset: int) -> list[Message]:
        q = (
            select(Message)
            .where(Message.chat_id == chat_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
            .offset(offset)
        )
        res = await db.execute(q)
        return list(res.scalars().all())

    async def last_n_for_context(self, db: AsyncSession, chat_id: uuid.UUID, n: int) -> list[Message]:
        # берём последние n по времени, потом разворачиваем в правильный порядок
        q = (
            select(Message)
            .where(Message.chat_id == chat_id)
            .order_by(Message.created_at.desc())
            .limit(n)
        )
        res = await db.execute(q)
        items = list(res.scalars().all())
        items.reverse()
        return items

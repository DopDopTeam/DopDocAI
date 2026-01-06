import uuid
from sqlalchemy import DateTime, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM as PG_ENUM
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.core.config import settings

SCHEMA = settings.db_schema


class Base(DeclarativeBase):
    pass


MessageRole = PG_ENUM("user", "assistant", name="message_role", schema=SCHEMA, create_type=False)


class Chat(Base):
    __tablename__ = "chats"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    repo_id: Mapped[int] = mapped_column(nullable=False)   # без FK (как ты и делаешь в микросервисах)
    user_id: Mapped[int] = mapped_column(nullable=False)

    created_at: Mapped[object] = mapped_column(DateTime, nullable=False, server_default=func.now())

    messages: Mapped[list["Message"]] = relationship(
        back_populates="chat",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Message.created_at",
    )


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    chat_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.chats.id", ondelete="CASCADE"),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(MessageRole, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[object] = mapped_column(DateTime, nullable=False, server_default=func.now())

    chat: Mapped["Chat"] = relationship(back_populates="messages")

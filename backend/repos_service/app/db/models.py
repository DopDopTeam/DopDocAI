from sqlalchemy import BigInteger, DateTime, Integer, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import ENUM as PgEnum
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from app.core.config import settings


class Base(DeclarativeBase):
    pass


RepoIndexStatus = PgEnum(
    "queued", "processing", "done", "failed",
    name="repo_index_status",
    schema=settings.db_schema,
)


class Repository(Base):
    __tablename__ = "repositories"
    __table_args__ = {"schema": settings.db_schema}

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    url: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(Text, nullable=False)
    default_branch: Mapped[str | None] = mapped_column(Text, nullable=True)

    last_indexed_at: Mapped[object | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[object] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[object] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class RepoIndexState(Base):
    __tablename__ = "repo_index_states"
    __table_args__ = (
        UniqueConstraint("user_id", "repository_id", name="uq_repo_index_state"),
        {"schema": settings.db_schema},
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    repository_id: Mapped[int] = mapped_column(BigInteger, nullable=False)

    branch: Mapped[str | None] = mapped_column(Text, nullable=True)
    qdrant_collection: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[str] = mapped_column(RepoIndexStatus, nullable=False, server_default="queued")
    vectors_upserted: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    indexed_at: Mapped[object | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[object] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[object] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

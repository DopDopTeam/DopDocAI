from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Repository, RepoIndexState


class ReposRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_with_state(self, repo_id: int, user_id: int) -> tuple[Repository, RepoIndexState] | None:
        stmt = (
            select(Repository, RepoIndexState)
            .join(RepoIndexState, RepoIndexState.repository_id == Repository.id)
            .where(Repository.id == repo_id, RepoIndexState.user_id == user_id)
        )
        res = await self.db.execute(stmt)
        row = res.first()
        return row if row else None

    async def get_by_url(self, url: str) -> Repository | None:
        res = await self.db.execute(
            select(Repository).where(Repository.url == url)
        )
        return res.scalar_one_or_none()

    async def list_with_state(self, user_id: int) -> list[tuple[Repository, RepoIndexState]]:
        stmt = (
            select(Repository, RepoIndexState)
            .join(RepoIndexState, RepoIndexState.repository_id == Repository.id)
            .where(RepoIndexState.user_id == user_id)
            .order_by(Repository.updated_at.desc())
        )
        res = await self.db.execute(stmt)
        return list(res.all())

    async def create(self, repo: Repository) -> Repository:
        self.db.add(repo)
        await self.db.commit()
        await self.db.refresh(repo)
        return repo

    async def save(self, repo: Repository) -> Repository:
        await self.db.commit()
        await self.db.refresh(repo)
        return repo

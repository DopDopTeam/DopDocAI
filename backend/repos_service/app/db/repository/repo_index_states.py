from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import RepoIndexState


class RepoIndexStatesRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, state_id: int) -> RepoIndexState | None:
        res = await self.db.execute(
            select(RepoIndexState).where(RepoIndexState.id == state_id)
        )
        return res.scalar_one_or_none()

    async def get_by_keys(self, user_id: int, repository_id: int, branch: str | None) -> RepoIndexState | None:
        res = await self.db.execute(
            select(RepoIndexState).where(
                (RepoIndexState.user_id == user_id)
                & (RepoIndexState.repository_id == repository_id)
                & (RepoIndexState.branch == branch)
            )
        )
        return res.scalar_one_or_none()

    async def create(self, state: RepoIndexState) -> RepoIndexState:
        self.db.add(state)
        await self.db.commit()
        await self.db.refresh(state)
        return state

    async def save(self, state: RepoIndexState) -> RepoIndexState:
        await self.db.commit()
        await self.db.refresh(state)
        return state

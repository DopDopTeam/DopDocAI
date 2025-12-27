from datetime import datetime

from app.db.models import RepoIndexState
from app.db.repository.repo_index_states import RepoIndexStatesRepository


class RepoIndexService:
    def __init__(self, repo: RepoIndexStatesRepository):
        self.repo = repo

    async def get_repo_status(self, state_id: int) -> RepoIndexState:
        state = await self.repo.get_by_id(state_id)
        if not state:
            raise ValueError("RepoIndexState not found")
        return state

    async def create_or_get(self, user_id: int, repository_id: int, branch: str | None, qdrant_collection: str) -> RepoIndexState:
        state = await self.repo.get_by_keys(user_id, repository_id, branch)
        if state:
            # если стратегия коллекции поменялась — обновим
            state.qdrant_collection = qdrant_collection
            return await self.repo.save(state)

        created = RepoIndexState(
            user_id=user_id,
            repository_id=repository_id,
            branch=branch,
            qdrant_collection=qdrant_collection,
            status="queued",
            vectors_upserted=0,
            last_error=None,
        )
        return await self.repo.create(created)

    async def patch(self, state_id: int, status: str | None, vectors_upserted: int | None, last_error: str | None, indexed_at: str | None) -> RepoIndexState:
        state = await self.repo.get_by_id(state_id)
        if not state:
            raise ValueError("RepoIndexState not found")

        if status is not None:
            state.status = status
        if vectors_upserted is not None:
            state.vectors_upserted = vectors_upserted
        if last_error is not None:
            state.last_error = last_error
        if indexed_at is not None:
            # ISO string -> datetime
            state.indexed_at = datetime.fromisoformat(indexed_at.replace("Z", "+00:00"))

        return await self.repo.save(state)

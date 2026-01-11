from datetime import datetime, timezone

from app.db.models import Repository
from app.db.repository.repos import ReposRepository


class ReposService:
    def __init__(self, repo: ReposRepository):
        self.repo = repo

    async def get_repository(self, repo_id: int, user_id: int) -> dict:
        row = await self.repo.get_with_state(repo_id=repo_id, user_id=user_id)
        if not row:
            raise ValueError("Repository not found for this user")

        repo, state = row
        return {
            "id": repo.id,
            "url": repo.url,
            "slug": repo.slug,
            "default_branch": repo.default_branch,
            "last_indexed_at": repo.last_indexed_at,
            "created_at": repo.created_at,
            "updated_at": repo.updated_at,
            "index_state": {
                "id": state.id,
                "status": state.status,
                "branch": state.branch,
                "vectors_upserted": state.vectors_upserted,
                "last_error": state.last_error,
                "indexed_at": state.indexed_at,
            },
        }

    async def get_repos_list(self, user_id: int) -> list[dict]:
        rows = await self.repo.list_with_state(user_id)
        out: list[dict] = []
        for repo, state in rows:
            out.append({
                "id": repo.id,
                "url": repo.url,
                "slug": repo.slug,
                "default_branch": repo.default_branch,
                "last_indexed_at": repo.last_indexed_at,
                "created_at": repo.created_at,
                "updated_at": repo.updated_at,
                "index_state": {
                    "id": state.id,
                    "status": state.status,
                    "branch": state.branch,
                    "vectors_upserted": state.vectors_upserted,
                    "last_error": state.last_error,
                    "indexed_at": state.indexed_at,
                }
            })
        return out

    async def upsert(self, url: str, slug: str, default_branch: str | None) -> Repository:
        existing = await self.repo.get_by_url(url)
        if existing:
            existing.slug = slug
            existing.default_branch = default_branch
            return await self.repo.save(existing)

        created = Repository(
            url=url,
            slug=slug,
            default_branch=default_branch,
        )
        return await self.repo.create(created)

    async def touch_indexed(self, repo_id: int) -> Repository:
        repo = await self.repo.get_with_state(repo_id)
        if not repo:
            raise ValueError("Repository not found")

        repo.last_indexed_at = datetime.now(timezone.utc)
        return await self.repo.create(repo)

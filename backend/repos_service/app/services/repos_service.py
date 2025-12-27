from datetime import datetime, timezone

from app.db.models import Repository
from app.db.repository.repos import ReposRepository


class ReposService:
    def __init__(self, repo: ReposRepository):
        self.repo = repo

    async def get_repository(self, repo_id: int) -> Repository:
        repo = await self.repo.get_by_id(repo_id)
        if not repo:
            raise ValueError("Repository not found")
        return repo

    async def get_repos_list(self, limit: int, offset: int) -> list[Repository]:
        return await self.repo.list(limit=limit, offset=offset)

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
        repo = await self.repo.get_by_id(repo_id)
        if not repo:
            raise ValueError("Repository not found")

        repo.last_indexed_at = datetime.now(timezone.utc)
        return await self.repo.create(repo)

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.repository.repos import ReposRepository
from app.db.repository.repo_index_states import RepoIndexStatesRepository
from app.services.repos_service import ReposService
from app.services.repo_index_service import RepoIndexService


def get_repos_service(
    db: AsyncSession = Depends(get_db),
) -> ReposService:
    return ReposService(ReposRepository(db))


def get_repo_index_service(
    db: AsyncSession = Depends(get_db),
) -> RepoIndexService:
    return RepoIndexService(RepoIndexStatesRepository(db))

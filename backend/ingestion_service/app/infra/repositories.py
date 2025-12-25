from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infra.models import Repository, User, UserRepository


class UsersRepo:
    def get_by_id(self, db: Session, user_id: int) -> User | None:
        return db.get(User, user_id)


class RepositoriesRepo:
    def get_or_create(self, db: Session, *, url: str, slug: str, default_branch: str | None) -> Repository:
        repo = db.scalar(select(Repository).where(Repository.url == url))
        if repo:
            # можно обновить default_branch при необходимости
            return repo

        repo = Repository(url=url, slug=slug, default_branch=default_branch)
        db.add(repo)
        db.flush()  # получаем repo.id
        return repo


class UserRepositoriesRepo:
    def get_or_create(self, db: Session, *, user_id: int, repository_id: int, branch: str | None, qdrant_collection: str) -> UserRepository:
        ur = db.scalar(
            select(UserRepository)
            .where(UserRepository.user_id == user_id)
            .where(UserRepository.repository_id == repository_id)
            .where(UserRepository.branch.is_(branch) if branch is None else UserRepository.branch == branch)
        )
        if ur:
            return ur

        ur = UserRepository(
            user_id=user_id,
            repository_id=repository_id,
            branch=branch,
            qdrant_collection=qdrant_collection,
            status="queued",
        )
        db.add(ur)
        db.flush()
        return ur

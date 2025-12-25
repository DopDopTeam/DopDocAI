from sqlalchemy.orm import Session
from shutil import rmtree
from datetime import datetime, timezone

from app.domain.models import RepoIngestRequest, RepoIngestResponse
from app.infra.repositories import UsersRepo, RepositoriesRepo, UserRepositoriesRepo
from app.pipeline.processor import process_repo_and_upsert
from app.utils.url_converter import repo_url_to_slug, get_repo_name


class IngestService:
    def __init__(self, git, treesitter, embedder, qdrant_factory):
        self.git = git
        self.treesitter = treesitter
        self.embedder = embedder
        self.qdrant_factory = qdrant_factory

        self.users_repo = UsersRepo()
        self.repos_repo = RepositoriesRepo()
        self.user_repos_repo = UserRepositoriesRepo()

    def ingest_repo(self, db: Session, req: RepoIngestRequest) -> RepoIngestResponse:
        repo_url = str(req.repo_url)
        slug = repo_url_to_slug(repo_url)
        repo_name = get_repo_name(repo_url)
        collection = slug

        # 1) validate user exists
        user = self.users_repo.get_by_id(db, req.user_id)
        if not user:
            raise ValueError(f"User {req.user_id} not found")

        # 2) create repo + link
        repo = self.repos_repo.get_or_create(db, url=repo_url, slug=slug, default_branch=req.branch)
        user_repo = self.user_repos_repo.get_or_create(
            db,
            user_id=user.id,
            repository_id=repo.id,
            branch=req.branch,
            qdrant_collection=collection,
        )

        # 3) mark processing
        user_repo.status = "processing"
        user_repo.last_error = None
        db.commit()

        repo_path = None
        try:
            repo_path = self.git.clone(repo_url, req.branch)

            qdrant = self.qdrant_factory(collection)
            total = process_repo_and_upsert(
                root_path=repo_path,
                repo_name=repo_name,
                treesitter=self.treesitter,
                embedder=self.embedder,
                qdrant=qdrant,
            )

            # 4) update DB success
            user_repo.status = "done"
            user_repo.vectors_upserted = total
            user_repo.indexed_at = datetime.now(timezone.utc)
            repo.last_indexed_at = datetime.now(timezone.utc)
            db.commit()

            return RepoIngestResponse(
                repo=repo_url,
                vectors_upserted=total,
                repository_id=repo.id,
                user_repository_id=user_repo.id,
                status=str(user_repo.status),
            )

        except Exception as e:
            user_repo.status = "failed"
            user_repo.last_error = str(e)
            db.commit()
            raise
        finally:
            if repo_path and repo_path.exists():
                rmtree(repo_path, ignore_errors=True)

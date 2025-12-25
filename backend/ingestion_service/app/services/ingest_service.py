from shutil import rmtree
from datetime import datetime, timezone

from app.api.models import RepoIngestRequest, RepoIngestResponse
from app.pipeline.processor import process_repo_and_upsert
from app.utils.url_converter import repo_url_to_slug, get_repo_name
from app.infra.repos_client import ReposServiceClient


class IngestService:
    def __init__(self, git, treesitter, embedder, qdrant_factory, repos_client : ReposServiceClient):
        self.git = git
        self.treesitter = treesitter
        self.embedder = embedder
        self.qdrant_factory = qdrant_factory
        self.repos = repos_client

    def ingest_repo(self, req: RepoIngestRequest) -> RepoIngestResponse:
        repo_url = str(req.repo_url)
        slug = repo_url_to_slug(repo_url)
        repo_name = get_repo_name(repo_url)
        collection = slug

        # 1) upsert repository в repos_service
        repo = self.repos.upsert_repository(
            url=repo_url,
            slug=slug,
            default_branch=req.branch,
        )
        repository_id = repo["id"]

        # 2) create repo_index_state (без проверки пользователя в БД!)
        # repos_service может (опционально) валидировать user_id через auth_service,
        # но по твоему ТЗ он хранит user_id как число без FK.
        state = self.repos.create_index_state(
            user_id=req.user_id,
            repository_id=repository_id,
            branch=req.branch,
            qdrant_collection=collection,
        )
        state_id = state["id"]

        # 3) mark processing
        self.repos.patch_index_state(state_id, {
            "status": "processing",
            "last_error": None,
            "vectors_upserted": 0,
            "indexed_at": None,
        })

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

            # 4) update state success
            self.repos.patch_index_state(state_id, {
                "status": "done",
                "vectors_upserted": total,
                "last_error": None,
                "indexed_at": datetime.now(timezone.utc).isoformat(),
            })

            # 5) обновим репу (last_indexed_at)
            self.repos.touch_repository_indexed(repository_id)

            return RepoIngestResponse(
                repo=repo_url,
                vectors_upserted=total,
                repository_id=repository_id,
                repo_index_state_id=state_id,
                status="done",
            )

        except Exception as e:
            self.repos.patch_index_state(state_id, {
                "status": "failed",
                "last_error": str(e),
            })
            raise
        finally:
            if repo_path and repo_path.exists():
                rmtree(repo_path, ignore_errors=True)

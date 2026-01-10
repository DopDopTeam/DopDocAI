from dataclasses import dataclass
from datetime import datetime, timezone
from shutil import rmtree

from app.api.models import RepoIngestRequest
from app.pipeline.processor import process_repo_and_upsert
from app.utils.url_converter import repo_url_to_slug, get_repo_name
from app.infra.repos_client import ReposServiceClient

@dataclass(frozen=True)
class IngestJob:
    repo_url: str
    branch: str | None
    user_id: int

    slug: str
    repo_name: str
    collection: str

    repository_id: int
    state_id: int


class IngestService:
    def __init__(self, git, treesitter, embedder, qdrant_factory, repos_client : ReposServiceClient):
        self.git = git
        self.treesitter = treesitter
        self.embedder = embedder
        self.qdrant_factory = qdrant_factory
        self.repos = repos_client

    def create_ingest_job(self, req: RepoIngestRequest) -> IngestJob:
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

        # 2) create/get repo_index_state
        state = self.repos.create_index_state(
            user_id=req.user_id,
            repository_id=repository_id,
            branch=req.branch,
            qdrant_collection=collection,
        )
        state_id = state["id"]

        return IngestJob(
            repo_url=repo_url,
            branch=req.branch,
            user_id=req.user_id,
            slug=slug,
            repo_name=repo_name,
            collection=collection,
            repository_id=repository_id,
            state_id=state_id,
        )

    def run_ingest_job(self, job: IngestJob) -> None:
        """
        ВАЖНО: эта функция запускается через BackgroundTasks.
        Она НЕ должна кидать исключения наружу (клиент уже получил 202 + id).
        Ошибки отражаем статусом 'failed' в repos_service.
        """
        state_id = job.state_id
        repository_id = job.repository_id

        # mark processing
        self.repos.patch_index_state(state_id, {
            "status": "processing",
            "last_error": None,
            "vectors_upserted": 0,
            "indexed_at": None,
        })

        repo_path = None
        try:
            repo_path = self.git.clone(job.repo_url, job.branch)

            qdrant = self.qdrant_factory(job.collection)
            total = process_repo_and_upsert(
                root_path=repo_path,
                repo_name=job.repo_name,
                treesitter=self.treesitter,
                embedder=self.embedder,
                qdrant=qdrant,
            )

            # success
            self.repos.patch_index_state(state_id, {
                "status": "done",
                "vectors_upserted": total,
                "last_error": None,
                "indexed_at": datetime.now(timezone.utc).isoformat(),
            })

            self.repos.touch_repository_indexed(repository_id)

        except Exception as e:
            self.repos.patch_index_state(state_id, {
                "status": "failed",
                "last_error": str(e),
            })
        finally:
            if repo_path and repo_path.exists():
                rmtree(repo_path, ignore_errors=True)

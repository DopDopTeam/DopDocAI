from backend.ingestion_service.app.domain.models import RepoIngestRequest, RepoIngestResponse
from backend.ingestion_service.app.pipeline.processor import process_repo_and_upsert
from backend.ingestion_service.app.utils.url_converter import repo_url_to_slug, get_repo_name
import shutil

class IngestService:
    def __init__(self, git, treesitter, embedder, qdrant_factory):
        self.git = git
        self.treesitter = treesitter
        self.embedder = embedder
        self.qdrant_factory = qdrant_factory

    def ingest_repo(self, req: RepoIngestRequest) -> RepoIngestResponse:
        repo_url = str(req.repo_url)
        repo_path = None
        try:
            repo_path = self.git.clone(repo_url, req.branch)

            collection = repo_url_to_slug(repo_url)
            qdrant = self.qdrant_factory(collection)

            total = process_repo_and_upsert(
                root_path=repo_path,
                repo_name=get_repo_name(repo_url),
                treesitter=self.treesitter,
                embedder=self.embedder,
                qdrant=qdrant,
            )

            return RepoIngestResponse(repo=repo_url, vectors_upserted=total)
        finally:
            if repo_path and repo_path.exists():
                shutil.rmtree(repo_path, ignore_errors=True)

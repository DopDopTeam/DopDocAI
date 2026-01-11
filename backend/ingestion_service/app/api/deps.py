from functools import lru_cache
from app.core.config import settings
from app.infra.qdrant_client import QdrantManager
from app.infra.repos_client import ReposServiceClient
from app.infra.treesitter_client import TreeSitterManager
from app.pipeline.embedder import Embedder
from app.services.ingest_service import IngestService
from app.infra.git_client import GitClient


@lru_cache
def get_treesitter() -> TreeSitterManager:
    return TreeSitterManager()

@lru_cache
def get_embedder() -> Embedder:
    # heavy init once per process
    return Embedder(model_name=settings.jina_model)

def get_qdrant(collection_name: str) -> QdrantManager:
    return QdrantManager(
        url=str(settings.qdrant_url),
        api_key=settings.qdrant_api_key,
        collection_name=collection_name,
        batch_size=settings.qdrant_batch_size,
    )

@lru_cache
def get_git_client() -> GitClient:
    return GitClient()

@lru_cache
def get_repos_client() -> ReposServiceClient:
    return ReposServiceClient(base_url=settings.repos_service_url)

def get_ingest_service() -> IngestService:
    return IngestService(
        git=get_git_client(),
        treesitter=get_treesitter(),
        embedder=get_embedder(),
        qdrant_factory=get_qdrant,
        repos_client=get_repos_client(),
    )

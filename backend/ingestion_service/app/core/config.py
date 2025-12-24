from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyUrl

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="INGEST_", extra="ignore")

    database_url: str = "postgresql+psycopg://ingest:ingest@localhost:5432/ingest"

    qdrant_url: AnyUrl = "http://localhost:6333"
    qdrant_api_key: str | None = None

    jina_model: str = "jinaai/jina-code-embeddings-0.5b"

    max_tokens: int = 512
    overlap: int = 64
    vector_size: int = 896
    qdrant_batch_size: int = 64

    host: str = "127.0.0.1"
    port: int = 8000

settings = Settings()

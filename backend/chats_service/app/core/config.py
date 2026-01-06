from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="CHATS_", extra="ignore")

    service_name: str = "chats_service"

    repos_service_url: str = "http://localhost:9000"
    repos_service_timeout_s: float = 5.0

    database_url: str = "postgresql+psycopg://dopdoc:dopdoc@172.17.0.1:5432/dopdoc"
    db_schema: str = "chats"

    host: str = "127.0.0.1"
    port: int = 9100

    # LLM router
    llm_router_api: str = "https://openrouter.ai/api/v1/chat/completions"
    llm_api_key: str = ""
    llm_model: str = "openai/gpt-4o-mini"   # пример
    llm_temperature: float = 0.2
    llm_max_tokens: int = 512

    # сколько сообщений истории подмешивать
    llm_history_limit: int = 20

    # системный промпт по умолчанию (можно хранить и на чат-уровне)
    default_system_prompt: str = "You are a helpful assistant."

settings = Settings()

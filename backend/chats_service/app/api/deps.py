from app.core.config import settings
from app.clients.repos_service import ReposServiceClient
from app.clients.ingestion_service import IngestionServiceClient
from app.services.chat_service import ChatService
from app.services.llm_service import LLMRouter


def get_chat_service() -> ChatService:
    llm = LLMRouter(router_api=settings.llm_router_api, api_key=settings.llm_api_key)
    repos = ReposServiceClient(settings.repos_service_url, timeout_s=settings.repos_service_timeout_s)
    ingest = IngestionServiceClient(settings.ingestion_service_url)
    return ChatService(llm=llm, repos_client=repos, ingest_client=ingest)

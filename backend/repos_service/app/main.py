import uvicorn
from fastapi import FastAPI

from app.api.routes.repos import router as repos_router
from app.api.routes.repo_index_states import router as repo_index_states_router
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title="repos_service")

    @app.get("/health")
    async def healthcheck():
        return {"service": settings.service_name, "status": "healthy"}

    app.include_router(repos_router)
    app.include_router(repo_index_states_router)
    return app


app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )

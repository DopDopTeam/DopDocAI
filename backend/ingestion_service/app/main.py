import uvicorn
from fastapi import FastAPI

from app.api.routes.ingest import router as ingest_router
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title="ingestion_service")

    @app.get("/health")
    async def healthcheck():
        return {"message": "healthy"}

    app.include_router(ingest_router)
    return app


app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )

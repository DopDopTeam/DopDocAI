import uvicorn
from fastapi import FastAPI

from backend.ingestion_service.app.api.routes.ingest import router as ingest_router
from backend.ingestion_service.app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title="ingestion_service")

    @app.get("/")
    async def root():
        return {"message": "Hello World"}

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

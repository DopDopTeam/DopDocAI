import uvicorn
from fastapi import FastAPI
from app.api.routes.chats import router as chats_router
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title="chats_service")

    @app.get("/health")
    async def healthcheck():
        return {"service": settings.service_name, "status": "healthy"}

    app.include_router(chats_router)
    return app


app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
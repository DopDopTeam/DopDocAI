import os
import shutil

from fastapi import FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool

from backend.ingestion_service.models.repo_ingest_request_response import RepoIngestResponse, RepoIngestRequest
from backend.ingestion_service.pipeline import process_repo_and_upsert_qdrant
from backend.ingestion_service.qdrant import QdrantManager
from backend.ingestion_service.treesitter import TreeSitterManager
from backend.ingestion_service.utils.clone_remote_repo import clone_remote_repo
from backend.ingestion_service.utils.url_converter import get_repo_name, repo_url_to_slug


def register_endpoints(app: FastAPI):
    @app.get("/")
    async def root():
        return {"message": "Hello World"}

    @app.post("/ingest/repo", response_model=RepoIngestResponse)
    async def ingest_remote_repo(payload: RepoIngestRequest):
        try:
            return await run_in_threadpool(ingest_repo_sync, payload)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def ingest_repo_sync(payload: RepoIngestRequest) -> RepoIngestResponse:
        repo_path = None
        repo_url = str(payload.repo_url)

        try:
            repo_path = clone_remote_repo(repo_url, payload.branch)

            ts_mgr = TreeSitterManager()
            q_mgr = QdrantManager(
                os.getenv("QDRANT_URL", "http://localhost:6333"),
                os.getenv("QDRANT_API_KEY"),
                repo_url_to_slug(repo_url),
            )

            total_upserted = process_repo_and_upsert_qdrant(
                root_path=repo_path,
                repo_name=get_repo_name(repo_url),
                ts_mgr=ts_mgr,
                q_mgr=q_mgr,
                max_tokens=512,
                overlap=64,
            )

            return RepoIngestResponse(
                repo=repo_url,
                vectors_upserted=total_upserted,
            )

        finally:
            if repo_path and repo_path.exists():
                shutil.rmtree(repo_path, ignore_errors=True)
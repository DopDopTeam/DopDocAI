from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool

from app.api.models import RepoIngestRequest, RepoIngestResponse
from app.services.ingest_service import IngestService
from app.api.deps import get_ingest_service

router = APIRouter(prefix="/ingest", tags=["ingest"])

@router.post("/repo", response_model=RepoIngestResponse)
async def ingest_repo(
    payload: RepoIngestRequest,
    service: IngestService = Depends(get_ingest_service),
):
    try:
        return await run_in_threadpool(service.ingest_repo, payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

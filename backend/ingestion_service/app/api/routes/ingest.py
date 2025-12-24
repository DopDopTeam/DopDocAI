from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.domain.models import RepoIngestRequest, RepoIngestResponse
from app.services.ingest_service import IngestService
from app.api.deps import get_ingest_service
from app.api.deps_db import get_db

router = APIRouter(prefix="/ingest", tags=["ingest"])

@router.post("/repo", response_model=RepoIngestResponse)
async def ingest_repo(
    payload: RepoIngestRequest,
    db: Session = Depends(get_db),
    service: IngestService = Depends(get_ingest_service),
):
    try:
        return await run_in_threadpool(service.ingest_repo, db, payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

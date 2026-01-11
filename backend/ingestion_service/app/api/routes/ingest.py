from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks

from app.api.models import RepoIngestRequest, RepoIngestResponse
from app.services.ingest_service import IngestService
from app.api.deps import get_ingest_service

router = APIRouter(prefix="/ingest", tags=["ingest"])

@router.post("/repo", response_model=RepoIngestResponse, status_code=202)
async def ingest_repo(
    payload: RepoIngestRequest,
    background_tasks: BackgroundTasks,
    service: IngestService = Depends(get_ingest_service),
):
    try:
        # 1) быстро создаём job/state и возвращаем id
        job = service.create_ingest_job(payload)

        # 2) fire-and-forget (в фоне, уже после отдачи ответа)
        background_tasks.add_task(service.run_ingest_job, job)

        return RepoIngestResponse(
            repo=job.repo_url,
            vectors_upserted=0,
            repository_id=job.repository_id,
            repo_index_state_id=job.state_id,
            status="queued",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

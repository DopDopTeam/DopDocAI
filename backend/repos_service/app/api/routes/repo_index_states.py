from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_repo_index_service
from app.schemas.repo_index_states import RepoIndexStateOut, RepoIndexStateCreateIn, RepoIndexStatePatchIn
from app.services.repo_index_service import RepoIndexService

router = APIRouter(prefix="/repo-index-states", tags=["repo-index-states"])


@router.post("", response_model=RepoIndexStateOut, status_code=201)
async def create_state(
    payload: RepoIndexStateCreateIn,
    service: RepoIndexService = Depends(get_repo_index_service),
):
    return await service.create_or_get(**payload.model_dump())

@router.get("/by-user-repo", response_model=RepoIndexStateOut) # join key endpoint
async def get_state_by_user_repo(
    user_id: int = Query(..., ge=1),
    repository_id: int = Query(..., ge=1),
    service: RepoIndexService = Depends(get_repo_index_service),
):
    try:
        return await service.get_by_user_repo(user_id=user_id, repository_id=repository_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{state_id}", response_model=RepoIndexStateOut, name="get_repo_status")
async def get_repo_status(
    state_id: int,
    service: RepoIndexService = Depends(get_repo_index_service),
):
    try:
        return await service.get_repo_status(state_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{state_id}", response_model=RepoIndexStateOut)
async def patch_state(
    state_id: int,
    payload: RepoIndexStatePatchIn,
    service: RepoIndexService = Depends(get_repo_index_service),
):
    try:
        return await service.patch(state_id, **payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

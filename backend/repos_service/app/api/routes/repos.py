from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_repos_service
from app.schemas.repos import RepositoryOut, RepositoryUpsertIn
from app.services.repos_service import ReposService

router = APIRouter(prefix="/repos", tags=["repos"])


@router.get("/{user_id}/list", response_model=list[RepositoryOut], name="get_repos_list")
async def get_repos_list(
    user_id: int,
    service: ReposService = Depends(get_repos_service),
):
    return await service.get_repos_list(user_id)


@router.get("/{repo_id}", response_model=RepositoryOut, name="get_repository")
async def get_repository(
    repo_id: int,
    service: ReposService = Depends(get_repos_service),
):
    try:
        return await service.get_repository(repo_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/upsert", response_model=RepositoryOut)
async def upsert_repository(
    payload: RepositoryUpsertIn,
    service: ReposService = Depends(get_repos_service),
):
    return await service.upsert(
        url=str(payload.url),
        slug=payload.slug,
        default_branch=payload.default_branch,
    )


@router.post("/{repo_id}/touch-indexed", response_model=RepositoryOut)
async def touch_indexed(
    repo_id: int,
    service: ReposService = Depends(get_repos_service),
):
    try:
        return await service.touch_indexed(repo_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
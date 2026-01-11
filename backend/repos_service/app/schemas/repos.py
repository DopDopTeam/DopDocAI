from datetime import datetime
from pydantic import BaseModel, HttpUrl

class RepositoryUpsertIn(BaseModel):
    url: HttpUrl
    slug: str
    default_branch: str | None = None

class RepoIndexStateSummaryOut(BaseModel):
    id: int
    status: str
    branch: str | None
    vectors_upserted: int
    last_error: str | None
    indexed_at: datetime | None

    class Config:
        from_attributes = True

class RepositoryOut(BaseModel):
    id: int
    url: HttpUrl
    slug: str
    default_branch: str | None
    last_indexed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # pydantic v2: allow ORM objects

class RepositoryWithIndexStateOut(RepositoryOut):
    index_state: RepoIndexStateSummaryOut
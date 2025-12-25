from datetime import datetime
from pydantic import BaseModel, HttpUrl

class RepositoryUpsertIn(BaseModel):
    url: HttpUrl
    slug: str
    default_branch: str | None = None

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

from datetime import datetime
from pydantic import BaseModel

class RepoIndexStateCreateIn(BaseModel):
    user_id: int
    repository_id: int
    branch: str | None = None
    qdrant_collection: str

class RepoIndexStatePatchIn(BaseModel):
    status: str | None = None
    vectors_upserted: int | None = None
    last_error: str | None = None
    indexed_at: str | None = None  # ISO string, упростим

class RepoIndexStateOut(BaseModel):
    id: int
    user_id: int
    repository_id: int
    branch: str | None
    qdrant_collection: str
    status: str
    vectors_upserted: int
    last_error: str | None
    indexed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

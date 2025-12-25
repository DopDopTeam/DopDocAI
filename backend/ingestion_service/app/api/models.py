from pydantic import BaseModel, HttpUrl

class RepoIngestRequest(BaseModel):
    repo_url: HttpUrl
    branch: str | None = None
    # MVP: пока нет auth middleware — передаём user_id в теле
    user_id: int

class RepoIngestResponse(BaseModel):
    repo: str
    vectors_upserted: int
    repository_id: int
    repo_index_state_id: int
    status: str

from pydantic import BaseModel, HttpUrl

class RepoIngestRequest(BaseModel):
    repo_url: HttpUrl
    branch: str | None = None

class RepoIngestResponse(BaseModel):
    repo: str
    vectors_upserted: int

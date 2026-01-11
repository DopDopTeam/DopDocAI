import httpx


class RepoNotFoundError(Exception):
    pass

class RepoNotIndexedError(Exception):
    pass


class ReposServiceClient:
    def __init__(self, base_url: str, *, timeout_s: float = 5.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout_s = timeout_s

    async def ensure_repo_exists(self, repo_id: int, user_id: int) -> None:
        url = f"{self.base_url}/repos/{repo_id}?user_id={user_id}"
        async with httpx.AsyncClient(timeout=self.timeout_s) as client:
            resp = await client.get(url)

        if resp.status_code == 404:
            raise RepoNotFoundError(f"repository {repo_id} not found")
        resp.raise_for_status()

    async def get_index_state(self, *, user_id: int, repository_id: int) -> dict:
        url = f"{self.base_url}/repo-index-states/by-user-repo"
        async with httpx.AsyncClient(timeout=self.timeout_s) as client:
            resp = await client.get(url, params={"user_id": user_id, "repository_id": repository_id})
        if resp.status_code == 404:
            raise RepoNotIndexedError(f"index state not found for user_id={user_id}, repo_id={repository_id}")
        resp.raise_for_status()
        return resp.json()

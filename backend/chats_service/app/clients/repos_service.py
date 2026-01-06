import httpx


class RepoNotFoundError(Exception):
    pass


class ReposServiceClient:
    def __init__(self, base_url: str, *, timeout_s: float = 5.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout_s = timeout_s

    async def ensure_repo_exists(self, repo_id: int) -> None:
        url = f"{self.base_url}/repos/{repo_id}"
        async with httpx.AsyncClient(timeout=self.timeout_s) as client:
            resp = await client.get(url)

        if resp.status_code == 404:
            raise RepoNotFoundError(f"repository {repo_id} not found")
        resp.raise_for_status()

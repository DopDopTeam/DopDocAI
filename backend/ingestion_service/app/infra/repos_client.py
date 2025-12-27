import requests
from dataclasses import dataclass
from typing import Any


@dataclass
class ReposServiceClient:
    base_url: str
    timeout_s: float = 10.0

    def _url(self, path: str) -> str:
        return f"{self.base_url.rstrip('/')}{path}"

    def upsert_repository(self, url: str, slug: str, default_branch: str | None) -> dict[str, Any]:
        r = requests.post(
            self._url("/repos/upsert"),
            json={"url": url, "slug": slug, "default_branch": default_branch},
            timeout=self.timeout_s,
        )
        r.raise_for_status()
        return r.json()

    def create_index_state(self, user_id: int, repository_id: int, branch: str | None, qdrant_collection: str) -> dict[str, Any]:
        r = requests.post(
            self._url("/repo-index-states"),
            json={
                "user_id": user_id,
                "repository_id": repository_id,
                "branch": branch,
                "qdrant_collection": qdrant_collection,
            },
            timeout=self.timeout_s,
        )
        r.raise_for_status()
        return r.json()

    def patch_index_state(self, state_id: int, patch: dict[str, Any]) -> dict[str, Any]:
        r = requests.patch(
            self._url(f"/repo-index-states/{state_id}"),
            json=patch,
            timeout=self.timeout_s,
        )
        r.raise_for_status()
        return r.json()

    def touch_repository_indexed(self, repository_id: int) -> dict[str, Any]:
        r = requests.post(
            self._url(f"/repos/{repository_id}/touch-indexed"),
            timeout=self.timeout_s,
        )
        r.raise_for_status()
        return r.json()

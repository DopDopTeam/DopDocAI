import httpx

class IngestionServiceClient:
    def __init__(self, base_url: str, *, timeout_s: float = 30.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout_s = timeout_s

    async def rag_search(self, *, collection: str, query: str, top_k: int) -> dict:
        url = f"{self.base_url}/rag/search"
        async with httpx.AsyncClient(timeout=self.timeout_s) as client:
            resp = await client.post(url, json={"collection": collection, "query": query, "top_k": top_k})
        resp.raise_for_status()
        return resp.json()

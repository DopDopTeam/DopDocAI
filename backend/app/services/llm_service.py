from dataclasses import dataclass
from typing import Literal
import requests

@dataclass(frozen=True)
class LLMConfig:
    model: str
    temperature: float
    max_tokens: int

@dataclass
class LLMMessage:
    role: Literal["system", "user", "assistant"]
    content: str

@dataclass
class LLMUsage:
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

@dataclass
class LLMResponse:
    text: str
    model: str
    provider: str
    usage: LLMUsage | None = None
    finish_reason: Literal["stop", "length", "error"] | None = None


class LLMRouter:
    def __init__(self, router_api: str, api_key: str) -> None:
        self.router_api = router_api
        self.api_key = api_key

    def generate(
            self,
            prompt: str, 
            *, 
            config: LLMConfig,
            context: list[LLMMessage] | None = None
    ) -> LLMResponse:
        messages: list[dict[str, str]] = []
        if context:
            for msg in context:
                messages.append({
                    "role": msg.role,
                    "content": msg.content,
                })
        
        messages.append({
            "role": "user",
            "content": prompt,
        })

        resp = requests.post(
        self.router_api,
        headers={
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost",
            "X-Title": "docs-mvp",
        },
        json={
            "model": config.model,
            "messages": messages,
            "temperature": config.temperature,
            "max_tokens": config.max_tokens,
        },
        timeout=60,
        )

        data = resp.json()

        return LLMResponse(
            text=data["choices"][0]["message"]["content"],
            model=data.get("model", config.model),
            provider="router",
            finish_reason=data["choices"][0].get("finish_reason"),
        )
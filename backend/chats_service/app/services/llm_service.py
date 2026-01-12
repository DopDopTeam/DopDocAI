from dataclasses import dataclass
from typing import Literal

import httpx


# Конфиг для запроса
@dataclass(frozen=True)
class LLMConfig:
    model: str
    temperature: float
    max_tokens: int
    top_p: float
    repetition_penalty: float


'''
system -> как отвечать
user -> что сделать
assistant -> что было (память)
'''


@dataclass
class LLMMessage:
    role: Literal["system", "user", "assistant"]
    content: str


# Нужен для трекинга токенов, они не бесконечные
@dataclass
class LLMUsage:
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


# Сериализация ответов нейронки
@dataclass
class LLMResponse:
    text: str
    model: str
    provider: str
    usage: LLMUsage | None = None
    finish_reason: Literal["stop", "length", "error"] | None = None


class LLMRouter:
    def __init__(self, router_api: str, api_key: str, *, timeout_s: float = 60.0) -> None:
        self.router_api = router_api
        self.api_key = api_key
        self.timeout_s = timeout_s

    async def generate(
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

        async with httpx.AsyncClient(timeout=self.timeout_s) as client:
            resp = await client.post(
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
                    "top_p" : config.top_p,
                    "repetition_penalty": config.repetition_penalty,
                },
            )

        resp.raise_for_status()
        data = resp.json()

        usage = None
        if "usage" in data and data["usage"]:
            u = data["usage"]
            usage = LLMUsage(
                prompt_tokens=int(u.get("prompt_tokens", 0)),
                completion_tokens=int(u.get("completion_tokens", 0)),
                total_tokens=int(u.get("total_tokens", 0)),
            )

        return LLMResponse(
            text=data["choices"][0]["message"]["content"],
            model=data.get("model", config.model),
            provider="router",
            usage=usage,
            finish_reason=data["choices"][0].get("finish_reason"),
        )
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_chat_service
from app.clients.repos_service import RepoNotFoundError
from app.db.session import get_db
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chats", tags=["chats"])


class ChatCreateRequest(BaseModel):
    repo_id: int
    user_id: int


class ChatResponse(BaseModel):
    id: uuid.UUID
    repo_id: int
    user_id: int

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: uuid.UUID
    chat_id: uuid.UUID
    role: str
    content: str

    class Config:
        from_attributes = True


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=50_000)


class SendMessageResponse(BaseModel):
    user_message: MessageResponse
    assistant_message: MessageResponse
    model: str
    provider: str
    finish_reason: str | None = None


@router.post("", response_model=ChatResponse)
async def create_chat(
    payload: ChatCreateRequest,
    db: AsyncSession = Depends(get_db),
    service: ChatService = Depends(get_chat_service),
):
    try:
        return await service.create_chat(db, repo_id=payload.repo_id, user_id=payload.user_id)
    except RepoNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    service: ChatService = Depends(get_chat_service),
):
    chat = await service.get_chat(db, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="chat not found")
    return chat


@router.get("", response_model=list[ChatResponse])
async def get_chats_list(
    user_id: int = Query(...),
    repo_id: int | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    service: ChatService = Depends(get_chat_service),
):
    return await service.list_chats(db, user_id=user_id, repo_id=repo_id, limit=limit, offset=offset)


@router.get("/{chat_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    chat_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    service: ChatService = Depends(get_chat_service),
):
    chat = await service.get_chat(db, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="chat not found")
    return await service.list_messages(db, chat_id, limit=limit, offset=offset)


@router.post("/{chat_id}/messages", response_model=SendMessageResponse)
async def send_message(
    chat_id: uuid.UUID,
    payload: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    service: ChatService = Depends(get_chat_service),
):
    try:
        user_msg, assistant_msg, llm_resp = await service.send_message(db, chat_id=chat_id, content=payload.content)
        return SendMessageResponse(
            user_message=user_msg,
            assistant_message=assistant_msg,
            model=llm_resp.model,
            provider=llm_resp.provider,
            finish_reason=llm_resp.finish_reason,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

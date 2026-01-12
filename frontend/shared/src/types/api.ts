import {UUID, RepoIndexStatus, MessageRole} from "./domain";

export interface RepoIngestRequest {
    repo_url: string;
    branch?: string | null;
    user_id: number;
}

export interface RepoIngestResponse {
    repo: string;
    vectors_upserted: number;
    repository_id: number;
    repo_index_state_id: number;
    status: RepoIndexStatus;
}

export interface RepoIndexStateCreateIn {
    user_id: number;
    repository_id: number;
    branch?: string | null;
    qdrant_collection: string;
}

export type ChatResponse = {
    id: UUID;
    repo_id: number;
    user_id: number;
};

export type MessageResponse = {
    id: UUID;
    chat_id: UUID;
    role: MessageRole;
    content: string;
};

export type SendMessageRequest = {
    content: string;
};

export type SendMessageResponse = {
    user_message: MessageResponse;
    assistant_message: MessageResponse;
    model: string;
    provider: string;
    finish_reason?: string | null;
};

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: "bearer" | string;
    expires_in: number;
    user_id: number;
    email: string;
}


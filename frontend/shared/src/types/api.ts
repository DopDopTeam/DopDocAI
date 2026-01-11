import type { Repository, RepoIndexState, Message, Source } from "./domain";

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponseDefault {
    access_token: string;
}

/**
 * Repos
 */
export type ListReposResponse = Repository[]; // ВАЖНО: теперь массив

export interface RepositoryUpsertRequest {
    url: string;
    slug: string;
    default_branch?: string | null;
}
export type RepositoryUpsertResponse = Repository;

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
    status: string; // "queued" и т.п.
}

/**
 * Repo index states
 */
export interface RepoIndexStateCreateIn {
    user_id: number;
    repository_id: number;
    branch?: string | null;
    qdrant_collection: string;
}
export type RepoIndexStateCreateResponse = RepoIndexState;

export interface RepoIndexStatePatchIn {
    status?: string | null;
    vectors_upserted?: number | null;
    last_error?: string | null;
    indexed_at?: string | null;
}
export type RepoIndexStatePatchResponse = RepoIndexState;

export type UUID = string;

export type ChatResponse = {
    id: UUID;
    repo_id: number;
    user_id: number;
};

export type MessageResponse = {
    id: UUID;
    chat_id: UUID;
    role: "user" | "assistant" | string;
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

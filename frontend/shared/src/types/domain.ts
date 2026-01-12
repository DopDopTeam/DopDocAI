export type UUID = string;

export interface Repository {
    id: number;
    url: string;
    slug: string;
    default_branch: string | null;
    last_indexed_at: string | null;
    created_at: string;
    updated_at: string;
    index_state: RepoIndexState;
}

export type RepoIndexStatus = "queued" | "processing" | "done" | "failed" | string;

export interface RepoIndexState {
    id: number;
    user_id: number;
    repository_id: number;
    branch: string | null;
    qdrant_collection: string;
    status: RepoIndexStatus;
    vectors_upserted: number;
    last_error: string | null;
    indexed_at: string | null;
    created_at: string;
    updated_at: string;
}
export type ChatMessage = {
    id: string;
    chat_id: string;
    role: MessageRole;
    content: string;
};

export type MessageRole = "user" | "assistant";

export interface Source {
    path: string;
    start_line: number;
    end_line: number;
}

export interface Message {
    id: string;
    repo_id: number;          // теперь repo_id логично number (как repoId)
    role: MessageRole;
    content: string;
    created_at?: string;
    sources?: Source[];
}
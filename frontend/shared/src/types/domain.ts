export type RepoStatus = "new" | "indexing" | "ready" | "error";

export interface Repo {
    id: number;
    url: string;
    status: RepoStatus;
    last_error?: string | null;
    updated_at?: string;
}

export interface Chat {
    id: string;
    repo_id: string;
    created_at?: string;
}

export type MessageRole = "user" | "assistant";

export interface Source {
    path: string;
    start_line: number;
    end_line: number;
}

export interface Message {
    id: string;
    repo_id: string;
    role: MessageRole;
    content: string;
    created_at?: string;

    // For assistant messages we may have sources (always show UI even if empty)
    sources?: Source[];
}

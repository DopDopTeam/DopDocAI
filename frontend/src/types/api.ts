export type RepoStatus = "new" | "indexing" | "ready" | "error";

export type Repo = {
    id: string;
    url: string;
    status: RepoStatus;
    last_commit_sha?: string | null;
    last_error?: string | null;
};

export type CreateRepoBody = { url: string };
export type CreateRepoResponse = { repo_id: string };

export type CreateChatBody = { repo_id: string };
export type CreateChatResponse = { chat_id: string };

export type Source = {
    path: string;
    start_line: number;
    end_line: number;
};

export type MessageRole = "user" | "assistant";

export type ChatMessage = {
    id: string;
    role: MessageRole;
    content: string;
    created_at: string;
    sources?: Source[];
};

export type SendMessageBody = { content: string };
export type SendMessageResponse = {
    answer: string;
    sources: Source[];
};

export type RepoStatusResponse = {
    status: RepoStatus;
    last_error?: string | null;
};

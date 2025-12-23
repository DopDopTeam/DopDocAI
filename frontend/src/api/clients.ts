import type {
    ChatMessage,
    CreateChatBody,
    CreateChatResponse,
    CreateRepoBody,
    CreateRepoResponse,
    Repo,
    RepoStatusResponse,
    SendMessageBody,
    SendMessageResponse,
} from "../types/api";

type ApiError = {
    message: string;
    status?: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`/api${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    });

    if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
            const text = await res.text();
            if (text) message = text;
        } catch {
            // ignore
        }
        const err: ApiError = { message, status: res.status };
        throw err;
    }

    // For all endpoints in spec we expect JSON
    return (await res.json()) as T;
}

export const api = {
    createRepo: (body: CreateRepoBody) =>
        request<CreateRepoResponse>(`/repos`, {
            method: "POST",
            body: JSON.stringify(body),
        }),

    listRepos: () => request<Repo[]>(`/repos`, { method: "GET" }),

    getRepoStatus: (repoId: string) =>
        request<RepoStatusResponse>(`/repos/${encodeURIComponent(repoId)}/status`, {
            method: "GET",
        }),

    createChat: (body: CreateChatBody) =>
        request<CreateChatResponse>(`/chats`, {
            method: "POST",
            body: JSON.stringify(body),
        }),

    listMessages: (chatId: string) =>
        request<ChatMessage[]>(
            `/chats/${encodeURIComponent(chatId)}/messages`,
            { method: "GET" },
        ),

    sendMessage: (chatId: string, body: SendMessageBody) =>
        request<SendMessageResponse>(
            `/chats/${encodeURIComponent(chatId)}/messages`,
            {
                method: "POST",
                body: JSON.stringify(body),
            },
        ),
};

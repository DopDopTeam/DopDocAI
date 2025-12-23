const KEY_SELECTED_REPO = "rag:selected_repo_id";
const KEY_CHAT_MAP = "rag:chat_by_repo_id";

export function getSelectedRepoId(): string | null {
    try {
        return localStorage.getItem(KEY_SELECTED_REPO);
    } catch {
        return null;
    }
}

export function setSelectedRepoId(repoId: string | null): void {
    try {
        if (!repoId) localStorage.removeItem(KEY_SELECTED_REPO);
        else localStorage.setItem(KEY_SELECTED_REPO, repoId);
    } catch {
        // ignore
    }
}

type ChatMap = Record<string, string>; // repo_id -> chat_id

export function getChatIdForRepo(repoId: string): string | null {
    try {
        const raw = localStorage.getItem(KEY_CHAT_MAP);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object") return null;
        const map = parsed as ChatMap;
        return typeof map[repoId] === "string" ? map[repoId] : null;
    } catch {
        return null;
    }
}

export function setChatIdForRepo(repoId: string, chatId: string): void {
    try {
        const raw = localStorage.getItem(KEY_CHAT_MAP);
        const map: ChatMap = raw ? (JSON.parse(raw) as ChatMap) : {};
        map[repoId] = chatId;
        localStorage.setItem(KEY_CHAT_MAP, JSON.stringify(map));
    } catch {
        // ignore
    }
}

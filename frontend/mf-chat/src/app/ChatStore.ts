import { makeAutoObservable, runInAction } from "mobx";
import { api, endpoints } from "@rag/shared";
import type { Message } from "@rag/shared";
import type {
    AssistantAnswer,
    ListMessagesResponse,
    SendMessageRequest,
} from "@rag/shared";

function makeTempId(prefix: string) {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export class ChatStore {
    repoId: string | null = null;

    messages: Message[] = [];
    loading = false;
    sending = false;
    error: string | null = null;

    private loadSeq = 0;
    private sendSeq = 0;

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    setRouteRepoId(repoId: string | null) {
        this.repoId = repoId;

        this.messages = [];
        this.error = null;
    }

    async loadMessages() {
        const repoId = this.repoId;

        if (!repoId) {
            runInAction(() => {
                this.messages = [];
                this.loading = false;
                this.error = null;
            });
            return;
        }

        const seq = ++this.loadSeq;

        runInAction(() => {
            this.loading = true;
            this.error = null;
        });

        try {
            const res = await api.get<ListMessagesResponse>(
                endpoints.chat.messages(repoId)
            );

            if (seq !== this.loadSeq || repoId !== this.repoId) return;

            runInAction(() => {
                this.messages = res.data.items;
                this.loading = false;
            });
        } catch (e) {
            if (seq !== this.loadSeq) return;

            runInAction(() => {
                this.error = "Failed to load messages";
                this.loading = false;
            });
            throw e;
        }
    }

    async sendMessage(content: string) {
        const repoId = this.repoId;
        const trimmed = content.trim();

        if (!repoId) {
            runInAction(() => {
                this.error = "No repository selected";
            });
            return;
        }
        if (!trimmed) return;

        const seq = ++this.sendSeq;

        runInAction(() => {
            this.sending = true;
            this.error = null;
        });

        const optimisticUser: Message = {
            id: makeTempId("user"),
            repo_id: repoId,
            role: "user",
            content: trimmed,
        };

        const placeholderAssistant: Message = {
            id: makeTempId("assistant"),
            repo_id: repoId,
            role: "assistant",
            content: "Думаю…",
            sources: [],
        };

        runInAction(() => {
            this.messages = [...this.messages, optimisticUser, placeholderAssistant];
        });

        try {
            const req: SendMessageRequest = { content: trimmed };

            const res = await api.post<AssistantAnswer>(
                endpoints.chat.send(repoId),
                req
            );

            if (seq !== this.sendSeq || repoId !== this.repoId) return;

            runInAction(() => {
                this.messages = this.messages.map((m) =>
                    m.id === placeholderAssistant.id
                        ? { ...res.data.message, sources: res.data.sources ?? [] }
                        : m
                );
                this.sending = false;
            });
        } catch (e) {
            if (seq !== this.sendSeq) return;

            runInAction(() => {
                this.messages = this.messages.map((m) =>
                    m.id === placeholderAssistant.id
                        ? {
                            ...m,
                            content: "Ошибка при получении ответа",
                            sources: [],
                        }
                        : m
                );
                this.sending = false;
                this.error = "Failed to send message";
            });
            throw e;
        }
    }

    reset() {
        this.messages = [];
        this.error = null;
        this.loading = false;
        this.sending = false;
        this.loadSeq = 0;
        this.sendSeq = 0;
    }
}

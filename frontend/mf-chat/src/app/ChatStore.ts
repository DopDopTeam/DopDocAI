import {makeAutoObservable, runInAction} from "mobx";
import {api, authStore, endpoints} from "@rag/shared";
import type {
    Repository,
    ChatResponse,
    MessageResponse,
    SendMessageRequest,
    SendMessageResponse,
    ChatMessage
} from "@rag/shared";

function makeTempId(prefix: string) {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export class ChatStore {
    repoId: number | null = null;
    repo: Repository | null = null;

    chatId: string | null = null;

    messages: ChatMessage[] = [];
    loading = false;
    sending = false;
    error: string | null = null;

    private loadSeq = 0;
    private sendSeq = 0;

    constructor() {
        makeAutoObservable(this, {}, {autoBind: true});
    }

    get isBlocked() {
        return this.repoId == null || this.repo?.index_state.status !== "done";
    }

    /** Вызывается при смене route param */
    async openRepo(repoId: number | null) {
        const seq = ++this.loadSeq;

        runInAction(() => {
            this.repoId = repoId;
            this.repo = null;
            this.chatId = null;
            this.messages = [];
            this.error = null;
            this.loading = repoId != null;
            this.sending = false;
        });
        console.log(authStore.userId);
        if (authStore.userId == null) return;
        if (repoId == null) return;

        try {
            // 1) repo meta (нужен slug)
            const repoRes = await api.get<Repository>(endpoints.repos.get(repoId), {params: {user_id: authStore.userId}});
            if (seq !== this.loadSeq || this.repoId !== repoId) return;

            runInAction(() => {
                this.repo = repoRes.data;
            });

            // 2) найти существующий чат (если есть), иначе создать
            const chatId = await this.ensureChat(repoId, seq);
            if (!chatId) return;

            // 3) загрузить сообщения
            await this.loadMessages(chatId, seq);

            if (seq !== this.loadSeq) return;
            runInAction(() => {
                this.loading = false;
            });
        } catch (e) {
            if (seq !== this.loadSeq) return;
            runInAction(() => {
                this.loading = false;
                this.error = "Failed to open chat";
            });
            throw e;
        }
    }

    private async ensureChat(repoId: number, seq: number): Promise<string | null> {

        if (authStore.userId == null) return null;

        // сначала пробуем list (вдруг уже создан)
        const listRes = await api.get<ChatResponse[]>(endpoints.chats.list, {
            params: {user_id: authStore.userId, repo_id: repoId},
        });

        if (seq !== this.loadSeq || this.repoId !== repoId) return null;

        const existing = listRes.data?.[0];
        if (existing) {
            runInAction(() => {
                this.chatId = String(existing.id);
            });
            return String(existing.id);
        }

        // иначе create
        const createRes = await api.post<ChatResponse>(endpoints.chats.create, {
            user_id: authStore.userId,
            repo_id: repoId,
        });

        if (seq !== this.loadSeq || this.repoId !== repoId) return null;

        runInAction(() => {
            this.chatId = String(createRes.data.id);
        });

        return String(createRes.data.id);
    }

    private async loadMessages(chatId: string, seq: number) {
        const res = await api.get<MessageResponse[]>(endpoints.chats.messages(chatId), {
            params: {limit: 200, offset: 0},
        });

        if (seq !== this.loadSeq) return;

        const mapped: ChatMessage[] = res.data.map((m) => ({
            id: String(m.id),
            chat_id: String(m.chat_id),
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
        }));

        runInAction(() => {
            this.messages = mapped;
        });
    }

    async sendMessage(content: string) {
        const trimmed = content.trim();
        const chatId = this.chatId;

        if (!trimmed) return;

        if (!chatId || this.repoId == null) {
            runInAction(() => {
                this.error = "Select a repository first";
            });
            return;
        }

        const seq = ++this.sendSeq;

        runInAction(() => {
            this.sending = true;
            this.error = null;
        });

        const optimisticUserId = makeTempId("user");
        const placeholderId = makeTempId("assistant");

        const optimisticUser: ChatMessage = {
            id: optimisticUserId,
            chat_id: chatId,
            role: "user",
            content: trimmed,
        };

        const placeholderAssistant: ChatMessage = {
            id: placeholderId,
            chat_id: chatId,
            role: "assistant",
            content: "Думаю…",
        };

        runInAction(() => {
            this.messages = [...this.messages, optimisticUser, placeholderAssistant];
        });

        try {
            const req: SendMessageRequest = {content: trimmed};

            const res = await api.post<SendMessageResponse>(endpoints.chats.send(chatId), req);

            if (seq !== this.sendSeq) return;

            const userMsg: ChatMessage = {
                id: String(res.data.user_message.id),
                chat_id: String(res.data.user_message.chat_id),
                role: "user",
                content: res.data.user_message.content,
            };

            const assistantMsg: ChatMessage = {
                id: String(res.data.assistant_message.id),
                chat_id: String(res.data.assistant_message.chat_id),
                role: "assistant",
                content: res.data.assistant_message.content,
            };

            runInAction(() => {
                this.messages = this.messages.map((m) => {
                    if (m.id === optimisticUserId) return userMsg;
                    if (m.id === placeholderId) return assistantMsg;
                    return m;
                });
                this.sending = false;
            });
        } catch (e) {
            if (seq !== this.sendSeq) return;
            runInAction(() => {
                this.messages = this.messages.map((m) =>
                    m.id === placeholderId ? {...m, content: "Ошибка при получении ответа"} : m
                );
                this.sending = false;
                this.error = "Failed to send message";
            });
            throw e;
        }
    }

    reset() {
        runInAction(() => {
            this.repoId = null;
            this.repo = null;
            this.chatId = null;
            this.messages = [];
            this.error = null;
            this.loading = false;
            this.sending = false;
            this.loadSeq = 0;
            this.sendSeq = 0;
        });
    }
}

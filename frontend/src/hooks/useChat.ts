import * as React from "react";
import { api } from "../api/clients";
import type { ChatMessage, Source } from "../types/api";
import { getChatIdForRepo, setChatIdForRepo } from "../utils/storage";

type UseChatResult = {
    chatId: string | null;
    messages: ChatMessage[];
    loading: boolean;
    error: string | null;
    ensureChat: () => Promise<string | null>;
    reloadMessages: () => Promise<void>;
    send: (content: string) => Promise<void>;
    isSending: boolean;
};

function nowIso(): string {
    return new Date().toISOString();
}

function makeTempId(prefix: string): string {
    return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

export function useChat(repoId: string | null): UseChatResult {
    const [chatId, setChatId] = React.useState<string | null>(null);
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [isSending, setIsSending] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);

    // Restore chatId from localStorage when repo changes
    React.useEffect(() => {
        if (!repoId) {
            setChatId(null);
            setMessages([]);
            setError(null);
            return;
        }
        const stored = getChatIdForRepo(repoId);
        setChatId(stored);
        setMessages([]);
        setError(null);
    }, [repoId]);

    const reloadMessages = React.useCallback(async () => {
        if (!chatId) return;
        setLoading(true);
        try {
            setError(null);
            const data = await api.listMessages(chatId);
            setMessages(data);
        } catch (e: any) {
            setError(typeof e?.message === "string" ? e.message : "Не удалось загрузить сообщения");
        } finally {
            setLoading(false);
        }
    }, [chatId]);

    const ensureChat = React.useCallback(async (): Promise<string | null> => {
        if (!repoId) return null;

        const existing = getChatIdForRepo(repoId);
        if (existing) {
            setChatId(existing);
            return existing;
        }

        try {
            setError(null);
            const created = await api.createChat({ repo_id: repoId });
            setChatIdForRepo(repoId, created.chat_id);
            setChatId(created.chat_id);
            return created.chat_id;
        } catch (e: any) {
            setError(typeof e?.message === "string" ? e.message : "Не удалось создать чат");
            return null;
        }
    }, [repoId]);

    // Auto-load messages when chatId appears
    React.useEffect(() => {
        if (!chatId) return;
        void reloadMessages();
    }, [chatId, reloadMessages]);

    const send = React.useCallback(
        async (content: string) => {
            if (!repoId) return;
            const cid = chatId ?? (await ensureChat());
            if (!cid) return;

            setIsSending(true);
            setError(null);

            const optimisticUser: ChatMessage = {
                id: makeTempId("user"),
                role: "user",
                content,
                created_at: nowIso(),
            };

            const placeholderAssistant: ChatMessage = {
                id: makeTempId("assistant"),
                role: "assistant",
                content: "Думаю…",
                created_at: nowIso(),
                sources: [], // will be shown as "Источники не найдены" if stays empty
            };

            setMessages((prev) => [...prev, optimisticUser, placeholderAssistant]);

            try {
                const res = await api.sendMessage(cid, { content });
                const sources: Source[] = Array.isArray(res.sources) ? res.sources : [];
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === placeholderAssistant.id
                            ? {
                                ...m,
                                content: res.answer,
                                sources,
                            }
                            : m,
                    ),
                );
            } catch (e: any) {
                const msg = typeof e?.message === "string" ? e.message : "Не удалось отправить сообщение";
                setError(msg);
                // replace placeholder with error-ish assistant message (still with sources always visible)
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === placeholderAssistant.id
                            ? { ...m, content: `Ошибка: ${msg}`, sources: [] }
                            : m,
                    ),
                );
            } finally {
                setIsSending(false);
            }
        },
        [repoId, chatId, ensureChat],
    );

    return {
        chatId,
        messages,
        loading,
        error,
        ensureChat,
        reloadMessages,
        send,
        isSending,
    };
}

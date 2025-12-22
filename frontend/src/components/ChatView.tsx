import type { Repo } from "../types/api";
import { useChat } from "../hooks/useChat";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

type Props = {
    selectedRepo: Repo | null;
};

export default function ChatView({ selectedRepo }: Props) {
    const repoId = selectedRepo?.id ?? null;
    const { messages, loading, error, send, isSending } = useChat(repoId);

    const chatEnabled = Boolean(selectedRepo && selectedRepo.status === "ready");

    return (
        <div className="flex h-full flex-col">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">Чат</h2>
                    <div className="mt-1 text-xs text-slate-500">
                        {selectedRepo ? (
                            <>
                                Репозиторий: <span className="font-mono">{selectedRepo.url}</span>
                            </>
                        ) : (
                            "Выберите репозиторий слева"
                        )}
                    </div>
                </div>

                {selectedRepo ? (
                    <div className="text-xs">
                        {selectedRepo.status === "ready" ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800">готов</span>
                        ) : selectedRepo.status === "indexing" ? (
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-800">индексация</span>
                        ) : selectedRepo.status === "error" ? (
                            <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-800">ошибка</span>
                        ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">new</span>
                        )}
                    </div>
                ) : null}
            </div>

            {error ? (
                <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                    Загрузка сообщений…
                </div>
            ) : (
                <MessageList messages={messages} />
            )}

            <MessageInput onSend={send} disabled={!chatEnabled} isSending={isSending} />
        </div>
    );
}

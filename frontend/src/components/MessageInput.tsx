import * as React from "react";

type Props = {
    onSend: (content: string) => Promise<void>;
    disabled?: boolean;
    isSending?: boolean;
};

export default function MessageInput({ onSend, disabled, isSending }: Props) {
    const [value, setValue] = React.useState<string>("");

    async function submit() {
        const v = value.trim();
        if (!v) return;
        setValue("");
        await onSend(v);
    }

    async function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!disabled && !isSending) await submit();
        }
    }

    return (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-end">
        <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled || isSending}
            placeholder={disabled ? "Чат недоступен: репозиторий ещё не готов" : "Введите вопрос… (Enter — отправить, Shift+Enter — новая строка)"}
            className="min-h-[70px] w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-300 disabled:bg-slate-50"
        />
                <button
                    type="button"
                    onClick={() => void submit()}
                    disabled={disabled || isSending || value.trim().length === 0}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 md:self-stretch"
                >
                    {isSending ? "Отправка…" : "Отправить"}
                </button>
            </div>
            <div className="mt-2 text-xs text-slate-500">
                Сообщение пользователя добавляется сразу. Ответ ассистента — с источниками.
            </div>
        </div>
    );
}

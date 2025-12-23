import * as React from "react";

type Props = {
    onSubmit: (url: string) => Promise<void>;
    disabled?: boolean;
};

export default function RepoIndexForm({ onSubmit, disabled }: Props) {
    const [url, setUrl] = React.useState<string>("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = url.trim();
        if (!trimmed) return;
        await onSubmit(trimmed);
        setUrl("");
    }

    return (
        <div className="space-y-2">
            <h2 className="text-sm font-semibold">Добавить репозиторий</h2>
            <form onSubmit={handleSubmit} className="space-y-2">
                <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={disabled}
                    placeholder="https://github.com/owner/repo"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none"
                />
                <button
                    type="submit"
                    disabled={disabled || url.trim().length === 0}
                    className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Индексировать
                </button>
            </form>
            <p className="text-xs text-slate-500">
                Только публичные GitHub репозитории. Индексация — одноразовая.
            </p>
        </div>
    );
}

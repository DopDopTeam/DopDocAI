import type { Repo } from "../types/api";
import StatusBadge from "./StatusBadge";

type Props = {
    repos: Repo[];
    selectedRepoId: string | null;
    onSelect: (repoId: string) => void;
};

export default function RepoList({ repos, selectedRepoId, onSelect }: Props) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Репозитории</h2>
                <span className="text-xs text-slate-500">{repos.length}</span>
            </div>

            <div className="max-h-[55vh] overflow-auto rounded-lg border border-slate-200">
                {repos.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500">Пока пусто. Добавьте репозиторий выше.</div>
                ) : (
                    <ul className="divide-y divide-slate-200">
                        {repos.map((r) => {
                            const active = r.id === selectedRepoId;
                            return (
                                <li key={r.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(r.id)}
                                        className={[
                                            "w-full text-left p-3 hover:bg-slate-50",
                                            active ? "bg-slate-50" : "bg-white",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium">{r.url}</div>
                                                {r.status === "error" && r.last_error ? (
                                                    <div className="mt-1 line-clamp-2 text-xs text-rose-700">
                                                        {r.last_error}
                                                    </div>
                                                ) : (
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {r.last_commit_sha ? `commit: ${r.last_commit_sha}` : "commit: —"}
                                                    </div>
                                                )}
                                            </div>
                                            <StatusBadge status={r.status} />
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

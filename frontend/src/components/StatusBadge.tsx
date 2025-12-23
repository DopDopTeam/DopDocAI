import type { RepoStatus } from "../types/api";

const map: Record<RepoStatus, { label: string; cls: string }> = {
    new: { label: "new", cls: "bg-slate-100 text-slate-700 border-slate-200" },
    indexing: { label: "indexing", cls: "bg-amber-50 text-amber-800 border-amber-200" },
    ready: { label: "ready", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    error: { label: "error", cls: "bg-rose-50 text-rose-800 border-rose-200" },
};

export default function StatusBadge({ status }: { status: RepoStatus }) {
    const s = map[status];
    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${s.cls}`}>
      {s.label}
    </span>
    );
}

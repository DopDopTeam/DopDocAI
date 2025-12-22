import * as React from "react";
import Layout from "./components/Layout";
import RepoIndexForm from "./components/RepoIndexForm";
import RepoList from "./components/RepoList";
import ChatView from "./components/ChatView";
import { useRepos } from "./hooks/useRepos";
import type { Repo } from "./types/api";
import { getSelectedRepoId, setSelectedRepoId } from "./utils/storage";

export default function App() {
    const { repos, loading, error, addRepo } = useRepos();

    const [selectedRepoId, setSelected] = React.useState<string | null>(() => getSelectedRepoId());

    React.useEffect(() => {
        setSelectedRepoId(selectedRepoId);
    }, [selectedRepoId]);

    // If selected repo disappears, reset selection
    React.useEffect(() => {
        if (!selectedRepoId) return;
        const exists = repos.some((r) => r.id === selectedRepoId);
        if (!exists) setSelected(null);
    }, [repos, selectedRepoId]);

    const selectedRepo: Repo | null =
        selectedRepoId ? repos.find((r) => r.id === selectedRepoId) ?? null : null;

    const left = (
        <div className="space-y-4">
            {error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {error}
                </div>
            ) : null}

            <RepoIndexForm onSubmit={addRepo} disabled={false} />

            <div className="h-px bg-slate-200" />

            {loading ? (
                <div className="text-sm text-slate-500">Загрузка репозиториев…</div>
            ) : (
                <RepoList repos={repos} selectedRepoId={selectedRepoId} onSelect={setSelected} />
            )}
        </div>
    );

    const right = <ChatView selectedRepo={selectedRepo} />;

    return <Layout left={left} right={right} />;
}

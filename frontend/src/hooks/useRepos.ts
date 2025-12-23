import * as React from "react";
import { api } from "../api/clients";
import type { Repo } from "../types/api";

type UseReposResult = {
    repos: Repo[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    addRepo: (url: string) => Promise<void>;
};

function isValidGitHubUrl(url: string): boolean {
    try {
        const u = new URL(url);
        return u.hostname.toLowerCase() === "github.com" && u.pathname.split("/").filter(Boolean).length >= 2;
    } catch {
        return false;
    }
}

export function useRepos(): UseReposResult {
    const [repos, setRepos] = React.useState<Repo[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);

    const refresh = React.useCallback(async () => {
        try {
            setError(null);
            const data = await api.listRepos();
            setRepos(data);
        } catch (e: any) {
            setError(typeof e?.message === "string" ? e.message : "Не удалось загрузить репозитории");
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        void refresh();
    }, [refresh]);

    // Polling: while any repo is indexing, GET /repos every 3–5 sec (we pick 4 sec)
    React.useEffect(() => {
        const hasIndexing = repos.some((r) => r.status === "indexing");
        if (!hasIndexing) return;

        const id = window.setInterval(() => {
            void refresh();
        }, 4000);

        return () => window.clearInterval(id);
    }, [repos, refresh]);

    const addRepo = React.useCallback(
        async (url: string) => {
            if (!isValidGitHubUrl(url)) {
                setError("Некорректный GitHub URL. Пример: https://github.com/owner/repo");
                return;
            }
            try {
                setError(null);
                await api.createRepo({ url });
                await refresh();
            } catch (e: any) {
                setError(typeof e?.message === "string" ? e.message : "Не удалось добавить репозиторий");
            }
        },
        [refresh],
    );

    return { repos, loading, error, refresh, addRepo };
}

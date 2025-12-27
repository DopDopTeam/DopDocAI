import { makeAutoObservable, runInAction } from "mobx";
import { api, endpoints } from "@rag/shared";
import type { Repo } from "@rag/shared";
import type { CreateRepoRequest, CreateRepoResponse, ListReposResponse } from "@rag/shared";

export class RepoStore {
    repos: Repo[] = [];
    loading = false;
    error: string | null = null;

    private pollTimer: number | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    get hasIndexing() {
        return this.repos.some((r) => r.status === "indexing" || r.status === "new");
    }

    async loadRepos() {
        this.loading = true;
        this.error = null;
        try {
            const res = await api.get<ListReposResponse>(endpoints.repos.list);
            runInAction(() => {
                this.repos = res.data.items;
                this.loading = false;
            });
            this.pollingWhileIndexing();
        } catch (e) {
            runInAction(() => {
                this.error = "Failed to load repositories";
                this.loading = false;
            });
            throw e;
        }
    }

    async createRepo(req: CreateRepoRequest) {
        this.error = null;
        const res = await api.post<CreateRepoResponse>(endpoints.repos.create, req);
        runInAction(() => {
            // Prepend for UX
            this.repos = [res.data, ...this.repos];
        });
        this.pollingWhileIndexing();
        return res.data;
    }

    pollingWhileIndexing() {
        if (this.hasIndexing) {
            if (this.pollTimer != null) return;
            this.pollTimer = window.setInterval(() => {
                void this.loadRepos().catch(() => {
                    // keep silent; UI already shows last known state
                });
            }, 4000);
            return;
        }

        if (this.pollTimer != null) {
            window.clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }

    dispose() {
        if (this.pollTimer != null) window.clearInterval(this.pollTimer);
        this.pollTimer = null;
    }
}

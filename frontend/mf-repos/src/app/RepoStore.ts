import { makeAutoObservable, runInAction } from "mobx";
import { api, endpoints } from "@rag/shared";
import type {
    Repository,
    RepoIndexState,
    RepoWithIndexState,
    RepoIngestRequest,
    RepoIngestResponse,
    RepoIndexStateCreateIn,
} from "@rag/shared";

export class RepoStore {
    repos: RepoWithIndexState[] = [];

    loadingList = false;
    loadingStatuses = false;

    error: string | null = null;

    private statusTimer: number | null = null;
    private statusesInFlight = false;

    // TODO: взять из auth/JWT
    userId = 1;

    constructor() {
        makeAutoObservable(this);
    }

    /** вызывай один раз при заходе на страницу */
    async init() {
        await this.loadReposList();
        this.startStatusPolling();
        void this.refreshStatuses({ ensureStateId: true });
    }

    /** грузим только список реп (без статусов) */
    async loadReposList() {
        this.loadingList = true;
        this.error = null;

        try {
            const res = await api.get<Repository[]>(endpoints.repos.list(this.userId));

            runInAction(() => {
                // сохраняем список реп, но стараемся не убить уже имеющиеся index_state
                const prevById = new Map(this.repos.map((r) => [r.id, r]));
                this.repos = res.data.map((repo) => {
                    const prev = prevById.get(repo.id);
                    return prev ? { ...repo, index_state: prev.index_state } : ({ ...repo } as RepoWithIndexState);
                });
                this.loadingList = false;
            });
        } catch (e) {
            runInAction(() => {
                this.loadingList = false;
                this.error = "Failed to load repositories";
            });
            throw e;
        }
    }

    private qdrantCollectionFor(repo: Repository): string {
        return `rag_repo_${repo.id}`;
    }

    /**
     * Создаёт/находит state по (user_id, repository_id, branch, qdrant_collection)
     * и возвращает state (там есть id).
     */
    private async createOrGetIndexState(repo: Repository): Promise<RepoIndexState> {
        const payload: RepoIndexStateCreateIn = {
            user_id: this.userId,
            repository_id: repo.id,
            branch: repo.default_branch,
            qdrant_collection: this.qdrantCollectionFor(repo),
        };

        const res = await api.post<RepoIndexState>(endpoints.repoIndexStates.createOrGet, payload);
        return res.data;
    }

    /** Обновление статусов отдельно от списка реп */
    async refreshStatuses(opts?: { ensureStateId?: boolean }) {
        if (this.statusesInFlight) return;
        if (this.repos.length === 0) return;

        this.statusesInFlight = true;
        this.loadingStatuses = true;

        try {
            const updates = await Promise.all(
                this.repos.map(async (repo) => {
                    // 1) если stateId неизвестен — при необходимости создаём/получаем
                    let state = repo.index_state;
                    if (!state?.id) {
                        if (!opts?.ensureStateId) return null;
                        state = await this.createOrGetIndexState(repo);
                        return { repoId: repo.id, state };
                    }

                    // 2) если stateId известен — просто GET и обновляем
                    const res = await api.get<RepoIndexState>(endpoints.repoIndexStates.get(state.id));
                    return { repoId: repo.id, state: res.data };
                })
            );

            runInAction(() => {
                const byRepoId = new Map(updates.filter(Boolean).map((u) => [u!.repoId, u!.state]));
                this.repos = this.repos.map((r) => {
                    const nextState = byRepoId.get(r.id);
                    return nextState ? { ...r, index_state: nextState } : r;
                });
            });
        } catch {
            // для polling лучше не орать на пользователя каждую итерацию
            // но можно залогировать где-то
        } finally {
            runInAction(() => {
                this.loadingStatuses = false;
            });
            this.statusesInFlight = false;
        }
    }

    startStatusPolling() {
        if (this.statusTimer != null) return;
        this.statusTimer = window.setInterval(() => {
            void this.refreshStatuses();
        }, 4000);
    }

    stopStatusPolling() {
        if (this.statusTimer == null) return;
        window.clearInterval(this.statusTimer);
        this.statusTimer = null;
    }

    /**
     * Добавление репозитория:
     * 1) upsert в repos-service
     * 2) старт индексации через ingestion-service
     * 3) обновляем список локально (или можно перезагрузить list — на твой вкус)
     * 4) подтягиваем свежий state по repo_index_state_id
     */
    async startIndexing(url: string, default_branch: string | null = null) {
        this.error = null;

        const ingestPayload: RepoIngestRequest = {
            repo_url: url,
            branch: default_branch,
            user_id: this.userId,
        };

        const ingestRes = await api.post<RepoIngestResponse>(endpoints.ingest, ingestPayload);

        const repoId = ingestRes.data.repository_id;
        const repoRes = await api.get<Repository>(endpoints.repos.get(repoId));
        const repo = repoRes.data;

        const stateId = ingestRes.data.repo_index_state_id;
        const stateRes = await api.get<RepoIndexState>(endpoints.repoIndexStates.get(stateId));
        const state = stateRes.data;

        runInAction(() => {
            const view: RepoWithIndexState = { ...repo, index_state: state };
            const idx = this.repos.findIndex((r) => r.id === view.id);
            if (idx >= 0) {
                this.repos = [view, ...this.repos.slice(0, idx), ...this.repos.slice(idx + 1)];
            } else {
                this.repos = [view, ...this.repos];
            }
        });

        this.startStatusPolling();

        return { repo, state };
    }

    dispose() {
        this.stopStatusPolling();
    }
}

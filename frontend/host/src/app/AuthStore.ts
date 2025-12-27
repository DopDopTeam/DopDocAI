import { makeAutoObservable, runInAction } from "mobx";
import { api, endpoints, storage } from "@rag/shared";
import type { LoginRequest, LoginResponseDefault } from "@rag/shared";

export class AuthStore {
    token: string | null = storage.getToken();
    loading = false;
    error: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    get isAuthenticated() {
        return true;//return Boolean(this.token);
    }

    async login(input: LoginRequest) {
        this.loading = true;
        this.error = null;
        try {
            const res = await api.post<LoginResponseDefault>(endpoints.auth.login, input);

            const token = res.data.access_token;
            runInAction(() => {
                this.token = token;
                storage.setToken(token);
                this.loading = false;
            });
        } catch (e) {
            runInAction(() => {
                this.error = "Login failed";
                this.loading = false;
            });
            throw e;
        }
    }

    logout() {
        this.token = null;
        storage.clearToken();
    }
}

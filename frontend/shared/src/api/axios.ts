import axios from "axios";
import { endpoints } from "./endpoints";
import { storage } from "../utils/storage";
import type { AuthResponse } from "../types/api";

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(cb: () => void) {
    onUnauthorized = cb;
}

declare module "axios" {
    export interface InternalAxiosRequestConfig {
        __retried?: boolean;
    }
}

export const api = axios.create({
    baseURL: "/api",         // важно: относительный, чтобы работало из host и из standalone remotes
    withCredentials: true,   // чтобы cookie refresh_token отправлялась
});

api.interceptors.request.use((config) => {
    const token = storage.getToken();
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const res = await api.post<AuthResponse>(endpoints.auth.refresh);
            storage.setToken(res.data.access_token);
            storage.setUserId(res.data.user_id);
            storage.setEmail(res.data.email);
            return res.data.access_token;
        } catch {
            storage.clearAuth();
            onUnauthorized?.();
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

api.interceptors.response.use(
    (r) => r,
    async (err) => {
        const status = err?.response?.status;
        const config = err?.config;

        if (!config || status !== 401) throw err;

        const url = String(config.url ?? "");

        // не зацикливаемся на auth endpoints
        if (url.includes(endpoints.auth.login) || url.includes(endpoints.auth.refresh)) {
            storage.clearAuth();
            onUnauthorized?.();
            throw err;
        }

        if (config.__retried) {
            storage.clearAuth();
            onUnauthorized?.();
            throw err;
        }

        const newToken = await refreshAccessToken();
        if (!newToken) throw err;

        config.__retried = true;
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${newToken}`;
        return api.request(config);
    }
);

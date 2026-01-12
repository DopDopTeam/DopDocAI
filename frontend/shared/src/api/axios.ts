import axios, { AxiosError } from "axios";
import { storage } from "../utils/storage";

export type OnUnauthorized = () => void;

let onUnauthorized: OnUnauthorized | null = null;

export function setOnUnauthorized(handler: OnUnauthorized) {
    onUnauthorized = handler;
}

export const api = axios.create({
    baseURL: "/api",
});

api.interceptors.request.use((config) => {
    // const token = storage.getToken();
    // if (token) {
    //     config.headers = config.headers ?? {};
    //     config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
});

api.interceptors.response.use(
    (r) => r,
    (error: AxiosError) => {
        const status = error.response?.status;
        if (status === 401) {
            storage.clearToken();
            onUnauthorized?.();
        }
        return Promise.reject(error);
    }
);

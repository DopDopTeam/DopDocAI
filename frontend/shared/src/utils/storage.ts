const KEY_TOKEN = "rag.jwt";

export const storage = {
    getToken(): string | null {
        return localStorage.getItem(KEY_TOKEN);
    },
    setToken(token: string) {
        localStorage.setItem(KEY_TOKEN, token);
    },
    clearToken() {
        localStorage.removeItem(KEY_TOKEN);
    },
};

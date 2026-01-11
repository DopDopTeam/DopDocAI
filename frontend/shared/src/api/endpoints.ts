// All endpoints live here so backend changes are edited in ONE place.

export const endpoints = {
    auth: {
        // Can be changed to "/auth/login" etc.
        login: "/auth/login"
    },
    repos: {
        list: (userId: number) => `/repos/${userId}/list`,
        get: (repoId: number) => `/repos/${repoId}`,
    },
    repoIndexStates: {
        createOrGet: "/repo-index-states",
        get: (stateId: number) => `/repo-index-states/${stateId}`,
        patch: (stateId: number) => `/repo-index-states/${stateId}`,
    },
    ingest: "/ingest/repo",
    chats: {
        list: "/chats",
        create: "/chats",
        messages: (chatId: string) => `/chats/${chatId}/messages`,
        send: (chatId: string) => `/chats/${chatId}/messages`,
    },
};

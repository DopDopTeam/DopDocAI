// All endpoints live here so backend changes are edited in ONE place.

export const endpoints = {
    auth: {
        // Can be changed to "/auth/login" etc.
        login: "/auth/login"
    },
    repos: {
        list: "/repos",
        create: "/repos"
    },
    chat: {
        // get-or-create chat for a repo
        messages: (repoId: string) => `/chats/${repoId}/messages`,
        send: (repoId: string) => `/chats/${repoId}/messages`
    }
};

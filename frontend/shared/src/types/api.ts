import type { Repo, Chat, Message, Source } from "./domain";

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponseDefault {
    access_token: string;
}

export interface ListReposResponse {
    items: Repo[];
}

export interface CreateRepoRequest {
    url: string;
}
export type CreateRepoResponse = Repo;

export interface GetOrCreateChatResponse {
    chat: Chat;
}

export interface ListMessagesResponse {
    items: Message[];
}

export interface SendMessageRequest {
    content: string;
}

export interface AssistantAnswer {
    message: Message; // role=assistant
    sources: Source[]; // may be empty
}

import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Divider } from "@mui/material";

import { chatStore } from "../app/store";
import { useRepoIdFromParams } from "../hooks/useRepoIdFromParams";
import { useAutoScroll } from "../hooks/useAutoScroll";

import { ChatRoot } from "./ChatRoot";
import { ChatBlocked } from "./ChatBlocked";
import { ChatHeader } from "./ChatHeader";
import { ChatStatus } from "./ChatStatus";
import { ChatMessageList } from "./ChatMessageList";
import { ChatComposer } from "./ChatComposer";

export const ChatPanel = observer(function ChatPanel() {
    const chat = chatStore;

    const repoId = useRepoIdFromParams();
    const bottomRef = useAutoScroll(chat.messages.length);

    useEffect(() => {
        void chat.openRepo(repoId);
    }, [repoId, chat]);

    if (chat.isBlocked) {
        return (
            <ChatRoot>
                <ChatBlocked />
            </ChatRoot>
        );
    }

    return (
        <ChatRoot>
            <ChatHeader repoSlug={chat.repo?.slug} />

            <Divider sx={{ my: 2 }} />

            <ChatStatus error={chat.error} loading={chat.loading} />

            <ChatMessageList messages={chat.messages} loading={chat.loading} bottomRef={bottomRef} />

            <Divider sx={{ my: 2 }} />

            <ChatComposer
                disabled={chat.loading || chat.sending}
                onSend={(content) => chat.sendMessage(content)}
            />
        </ChatRoot>
    );
});

export default ChatPanel;

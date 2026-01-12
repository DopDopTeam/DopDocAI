import React, { useCallback, useState } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type ChatMessageVM = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

async function copyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        return;
    } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
    }
}

export function ChatMessageList({
                                    messages,
                                    loading,
                                    bottomRef,
                                }: {
    messages: ChatMessageVM[];
    loading: boolean;
    bottomRef: React.RefObject<HTMLDivElement>;
}) {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const onCopy = useCallback(async (id: string, text: string) => {
        await copyToClipboard(text);
        setCopiedId(id);
        window.setTimeout(() => {
            setCopiedId((cur) => (cur === id ? null : cur));
        }, 1200);
    }, []);

    return (
        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", pr: 1, opacity: loading ? 0.7 : 1 }}>
            {messages.map((m) => {
                const isAssistant = m.role === "assistant";
                const isUser = m.role === "user";

                return (
                    <Box
                        key={m.id}
                        sx={{
                            mb: 2,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: isUser ? "flex-end" : "flex-start",
                        }}
                    >
                        <Box
                            sx={{
                                maxWidth: "900px",
                                width: "fit-content",
                                p: 1.5,
                                borderRadius: 2,
                                border: "1px solid rgba(255,255,255,0.12)",

                                // ✅ фон для сообщений пользователя
                                backgroundColor: isUser ? "rgba(144, 202, 249, 0.12)" : "transparent",
                                // чуть выделим рамку у user, опционально
                                borderColor: isUser ? "rgba(144, 202, 249, 0.25)" : "rgba(255,255,255,0.12)",
                            }}
                        >
                            <Box
                                sx={{
                                    // чуть нормализуем markdown под чат (опционально, но приятно)
                                    "& p": { m: 0, mb: 1, whiteSpace: "pre-wrap" },
                                    "& p:last-child": { mb: 0 },
                                    "& ul, & ol": { m: 0, pl: 3, mb: 1 },
                                    "& li:last-child": { mb: 0 },
                                }}
                            >
                                <Markdown remarkPlugins={[remarkGfm]}>{m.content}</Markdown>
                            </Box>
                        </Box>

                        {isAssistant && (
                            <Box sx={{ mt: 0.75, maxWidth: "900px", width: "fit-content", display: "flex", gap: 1 }}>
                                <Tooltip title={copiedId === m.id ? "Copied" : "Copy"}>
                                    <IconButton size="small" onClick={() => void onCopy(m.id, m.content)}>
                                        <ContentCopyIcon fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )}
                    </Box>
                );
            })}

            <div ref={bottomRef} />
        </Box>
    );
}

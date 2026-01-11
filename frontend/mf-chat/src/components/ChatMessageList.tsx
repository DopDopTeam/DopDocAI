import React from "react";
import { Box, Typography } from "@mui/material";

export type ChatMessageVM = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

export function ChatMessageList({
                                    messages,
                                    loading,
                                    bottomRef,
                                }: {
    messages: ChatMessageVM[];
    loading: boolean;
    bottomRef: React.RefObject<HTMLDivElement>;
}) {
    return (
        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", pr: 1, opacity: loading ? 0.7 : 1 }}>
            {messages.map((m) => (
                <Box
                    key={m.id}
                    sx={{
                        mb: 2,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: m.role === "user" ? "flex-end" : "flex-start",
                    }}
                >
                    <Box
                        sx={{
                            maxWidth: "900px",
                            width: "fit-content",
                            p: 1.5,
                            borderRadius: 2,
                            border: "1px solid rgba(255,255,255,0.12)",
                        }}
                    >
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                            {m.content}
                        </Typography>
                    </Box>
                </Box>
            ))}

            <div ref={bottomRef} />
        </Box>
    );
}

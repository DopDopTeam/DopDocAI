import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import {
    Box,
    Typography,
    TextField,
    Button,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Alert
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { type Message } from "@rag/shared";
import {chatStore} from "../app/store";

function isAssistant(m: Message) {
    return m.role === "assistant";
}

export const ChatPanel = observer(function ChatPanel() {
    const chat = chatStore;
    const [text, setText] = useState("");

    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat.messages.length]);

    async function onSend() {
        const v = text.trim();
        if (!v) return;
        setText("");
        await chat.sendMessage(v);
    }

    return (
        <Box sx={{ p: 2, width: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Chat
            </Typography>

            {chat.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {chat.error}
                </Alert>
            )}

            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", pr: 1 }}>
                {chat.messages.map((m) => (
                    <Box
                        key={m.id}
                        sx={{
                            mb: 2,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: m.role === "user" ? "flex-end" : "flex-start"
                        }}
                    >
                        <Box
                            sx={{
                                maxWidth: "900px",
                                width: "fit-content",
                                p: 1.5,
                                borderRadius: 2,
                                border: "1px solid rgba(255,255,255,0.12)"
                            }}
                        >
                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                                {m.content}
                            </Typography>
                        </Box>

                        {isAssistant(m) && (
                            <Box sx={{ mt: 1, width: "100%", maxWidth: "900px" }}>
                                <Accordion defaultExpanded={false}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography variant="caption">Sources</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        {m.sources && m.sources.length > 0 ? (
                                            <Box sx={{ display: "grid", gap: 0.5 }}>
                                                {m.sources.map((s, idx) => (
                                                    <Typography key={idx} variant="caption" sx={{ opacity: 0.9 }}>
                                                        - {s.path}:{s.start_line}–{s.end_line}
                                                    </Typography>
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                                Источники не найдены
                                            </Typography>
                                        )}
                                    </AccordionDetails>
                                </Accordion>
                            </Box>
                        )}
                    </Box>
                ))}
                <div ref={bottomRef} />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                    size="small"
                    placeholder={"Ask about the repository…"}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    fullWidth
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void onSend();
                        }
                    }}
                />
                <Button variant="contained" onClick={() => void onSend()}>
                    Send
                </Button>
            </Box>
        </Box>
    );
});

export default ChatPanel;

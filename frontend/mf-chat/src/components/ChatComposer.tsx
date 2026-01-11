import React, { useCallback, useState } from "react";
import { Box, TextField, Button } from "@mui/material";

export function ChatComposer({
                                 disabled,
                                 onSend,
                             }: {
    disabled: boolean;
    onSend: (content: string) => Promise<void> | void;
}) {
    const [text, setText] = useState("");

    const submit = useCallback(async () => {
        const v = text.trim();
        if (!v) return;
        setText("");
        await onSend(v);
    }, [text, onSend]);

    return (
        <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
                size="small"
                placeholder="Ask about the repository…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                fullWidth
                disabled={disabled}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void submit();
                    }
                }}
            />
            <Button variant="contained" onClick={() => void submit()} disabled={disabled}>
                Send
            </Button>
        </Box>
    );
}

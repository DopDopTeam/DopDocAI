import React from "react";
import { Box, Typography, Divider, TextField, Button } from "@mui/material";

export function ChatBlocked() {
    return (
        <>
            <Typography variant="h6">Chat</Typography>

            <Divider sx={{ my: 2 }} />

            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    display: "grid",
                    placeItems: "center",
                    border: "1px dashed rgba(255,255,255,0.18)",
                    borderRadius: 2,
                    p: 3,
                }}
            >
                <Typography variant="body2" sx={{ opacity: 0.85, textAlign: "center" }}>
                    Выберите репозиторий слева, чтобы открыть историю и начать чат.
                </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "flex", gap: 1, opacity: 0.5, pointerEvents: "none" }}>
                <TextField size="small" placeholder="Ask about the repository…" fullWidth value="" />
                <Button variant="contained" disabled>
                    Send
                </Button>
            </Box>
        </>
    );
}

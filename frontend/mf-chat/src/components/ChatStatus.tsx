import React from "react";
import { Alert } from "@mui/material";

export function ChatStatus({ error, loading }: { error: string | null; loading: boolean }) {
    return (
        <>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Loading…
                </Alert>
            )}
        </>
    );
}

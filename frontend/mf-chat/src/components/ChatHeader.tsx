import React from "react";
import { Typography } from "@mui/material";

export function ChatHeader({ repoSlug }: { repoSlug: string | undefined }) {
    const title = repoSlug ? `Chat — ${repoSlug}` : "Chat";
    return <Typography variant="h6">{title}</Typography>;
}

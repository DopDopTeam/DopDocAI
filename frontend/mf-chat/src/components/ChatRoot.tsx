import React from "react";
import { Box } from "@mui/material";

export function ChatRoot({ children }: { children: React.ReactNode }) {
    return (
        <Box sx={{ p: 2, width: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
            {children}
        </Box>
    );
}

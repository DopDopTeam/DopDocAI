import React from "react";
import {Box, Divider } from "@mui/material";

const SIDEBAR_W = 340;

export function AppLayout({ sidebar, content }: { sidebar: React.ReactNode; content: React.ReactNode; }) {
    return (
        <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
            <Box sx={{ width: SIDEBAR_W }} >
                {sidebar}
            </Box>

            <Divider orientation="vertical" flexItem />

            <Box sx={{ flex: 1, minWidth: 0, display: "flex" }}>
                {content}
            </Box>
        </Box>
    );
}


import React from "react";
import { Box, Drawer } from "@mui/material";

const SIDEBAR_W = 340;

export function AppLayout({
                              sidebar,
                              content
                          }: {
    sidebar: React.ReactNode;
    content: React.ReactNode;
}) {
    return (
        <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
                <Drawer
                    variant="permanent"
                    sx={{
                        width: SIDEBAR_W,
                        flexShrink: 0,
                        [`& .MuiDrawer-paper`]: {
                            width: SIDEBAR_W,
                            boxSizing: "border-box"
                        }
                    }}
                >
                    {sidebar}
                </Drawer>

                <Box sx={{ flex: 1, minWidth: 0, display: "flex" }}>{content}</Box>
            </Box>
        </Box>
    );
}

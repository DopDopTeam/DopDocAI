import React, { Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import { observer } from "mobx-react-lite";
import { TopBar } from "../components/TopBar";
import { AppLayout } from "../components/AppLayout";

const RepoSidebar = React.lazy(() => import("mf_repos/RepoSidebar"));
const ChatPanel = React.lazy(() => import("mf_chat/ChatPanel"));

export const ShellPage = observer(function ShellPage() {
    return (
        <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
            <TopBar />

            <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
                <AppLayout
                    sidebar={
                        <Suspense fallback={<Box sx={{ p: 2 }}><CircularProgress size={18} /></Box>}>
                            <RepoSidebar />
                        </Suspense>
                    }
                    content={
                        <Suspense fallback={<Box sx={{ p: 2, width: "100%" }}><CircularProgress /></Box>}>
                            <ChatPanel />
                        </Suspense>
                    }
                />
            </Box>
        </Box>
    );
});


import React from "react";
import ReactDOM from "react-dom/client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import {theme, setOnUnauthorized } from "@rag/shared";
import { ChatPanel } from "../components/ChatPanel";

setOnUnauthorized(() => console.warn("401 received (auth disabled)"));//window.location.assign("/login"));

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <ChatPanel />
            </ThemeProvider>
    </React.StrictMode>
);

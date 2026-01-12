import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme, setOnUnauthorized, authStore } from "@rag/shared";
import { RouterProvider } from "react-router-dom";
import { createAppRouter } from "./app/router";

import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";

setOnUnauthorized(() => {
    authStore.logout();
    if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
    }
});

void authStore.init();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <RouterProvider router={createAppRouter()} />
        </ThemeProvider>
    </React.StrictMode>
);

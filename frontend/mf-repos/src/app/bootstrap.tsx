import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import {theme} from "@rag/shared";
import { RepoSidebar } from "../components/RepoSidebar";


ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <RepoSidebar />
            </ThemeProvider>
    </React.StrictMode>
);

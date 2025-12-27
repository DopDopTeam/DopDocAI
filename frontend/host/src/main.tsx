import React, {createContext, useContext} from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import {theme, setOnUnauthorized} from "@rag/shared";
import { RouterProvider } from "react-router-dom";
import { createAppRouter } from "./app/router";
import {AuthStore} from "./app/AuthStore";

setOnUnauthorized(() => console.warn("401 (auth disabled)"));

const authStore = new AuthStore();
const AuthStoreCtx = createContext<AuthStore>(authStore);

export function useAuth() {
    const store = useContext(AuthStoreCtx);
    if (!store) {
        throw new Error("StoreProvider is missing");
    }
    return store;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <AuthStoreCtx.Provider value={authStore}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <RouterProvider router={createAppRouter()} />
            </ThemeProvider>
        </AuthStoreCtx.Provider>
    </React.StrictMode>
);

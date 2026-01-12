import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { ShellPage } from "../pages/ShellPage";
import { ProtectedRoute } from "../components/ProtectedRoute";

export function createAppRouter() {
    return createBrowserRouter([
        { path: "/", element: <Navigate to="/app" replace /> },

        { path: "/login", element: <LoginPage /> },

        {
            path: "/app",
            element: (
                <ProtectedRoute>
                    <ShellPage />
                </ProtectedRoute>
            ),
            children: [
                { index: true, element: null },
                { path: "repos/:repoId", element: null },
                { path: "repos", element: <Navigate to="/app" replace /> },
            ],
        },

        { path: "*", element: <Navigate to="/app" replace /> },
    ]);
}

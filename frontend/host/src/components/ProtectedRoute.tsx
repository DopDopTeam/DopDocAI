import React from "react";
import { observer } from "mobx-react-lite";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { authStore } from "@rag/shared"; // <- singleton

export const ProtectedRoute = observer(function ProtectedRoute({ children }: React.PropsWithChildren) {
    const location = useLocation();

    if (authStore.initializing) {
        return (
            <Box sx={{ height: "100vh", display: "grid", placeItems: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!authStore.isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return <>{children}</>;
});

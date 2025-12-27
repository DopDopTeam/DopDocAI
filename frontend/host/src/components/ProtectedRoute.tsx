import React from "react";
import { observer } from "mobx-react-lite";
import { Navigate, useLocation } from "react-router-dom";
import {useAuth} from "../main";

export const ProtectedRoute = observer(function ProtectedRoute({
                                                                   children
                                                               }: React.PropsWithChildren) {
    const auth = useAuth();
    const location = useLocation();

    if (!auth.isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return <>{children}</>;
});

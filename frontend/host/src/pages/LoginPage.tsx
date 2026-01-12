import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Box, Button, Container, TextField, Typography, Alert, Paper, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { authStore } from "@rag/shared";

export const LoginPage = observer(function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation() as any;

    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const from = location.state?.from ?? "/app";

    useEffect(() => {
        if (authStore.isAuthenticated) {
            navigate("/app", { replace: true });
        }
    }, [navigate]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            if (mode === "login") {
                await authStore.login({ email, password });
            } else {
                await authStore.register({ email, password });
            }
            navigate(from, { replace: true });
        } catch {
            // error already in store
        }
    }

    return (
        <Container maxWidth="sm">
            <Box sx={{ height: "100vh", display: "grid", placeItems: "center" }}>
                <Paper sx={{ p: 3, width: "100%" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 2 }}>
                        <Typography variant="h5">
                            {mode === "login" ? "Login" : "Register"}
                        </Typography>

                        <ToggleButtonGroup
                            size="small"
                            exclusive
                            value={mode}
                            onChange={(_, v) => v && setMode(v)}
                        >
                            <ToggleButton value="login">Login</ToggleButton>
                            <ToggleButton value="register">Register</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {authStore.error && <Alert severity="error" sx={{ mb: 2 }}>{authStore.error}</Alert>}

                    <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2 }}>
                        <TextField
                            label="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                        <TextField
                            label="Password (min 8 chars)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                            required
                            inputProps={{ minLength: 8 }}
                        />

                        <Button type="submit" variant="contained" disabled={authStore.loading}>
                            {authStore.loading
                                ? (mode === "login" ? "Signing in…" : "Creating account…")
                                : (mode === "login" ? "Sign in" : "Create account")}
                        </Button>

                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            После регистрации вы автоматически войдёте в систему.
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
});

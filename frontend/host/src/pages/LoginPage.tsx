import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Alert,
    Paper
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {useAuth} from "../main";

export const LoginPage = observer(function LoginPage() {
    const auth = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await auth.login({ username, password });
            navigate("/app", { replace: true });
        } catch {
            // auth.error already set
        }
    }

    return (
        <Container maxWidth="sm">
            <Box sx={{ height: "100vh", display: "grid", placeItems: "center" }}>
                <Paper sx={{ p: 3, width: "100%" }}>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        Login
                    </Typography>

                    {auth.error && <Alert severity="error" sx={{ mb: 2 }}>{auth.error}</Alert>}

                    <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2 }}>
                        <TextField
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            required
                        />
                        <TextField
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            autoComplete="current-password"
                            required
                        />
                        <Button type="submit" variant="contained" disabled={auth.loading}>
                            {auth.loading ? "Signing in…" : "Sign in"}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
});

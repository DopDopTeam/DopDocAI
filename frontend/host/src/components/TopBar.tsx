import React from "react";
import { observer } from "mobx-react-lite";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {useAuth} from "../main";

export const TopBar = observer(function TopBar() {
    const auth = useAuth();
    const navigate = useNavigate();

    return (
        <AppBar position="static" elevation={0}>
            <Toolbar sx={{ gap: 2 }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    GitHub Repo RAG
                </Typography>

                {auth.isAuthenticated && (
                    <Box>
                        <Button
                            color="inherit"
                            onClick={() => {
                                auth.logout();
                                navigate("/login", { replace: true });
                            }}
                        >
                            Logout
                        </Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
});

import React, {useEffect, useMemo, useState} from "react";
import { observer } from "mobx-react-lite";
import { useNavigate, useParams } from "react-router-dom";
import {
    Box,
    Divider,
    List,
    ListItemButton,
    ListItemText,
    TextField,
    Button,
    Chip,
    Typography,
    Snackbar,
    Alert
} from "@mui/material";
import { type Repo, type RepoStatus } from "@rag/shared";
import { repoStore  } from "../app/store";

function statusColor(
    status: RepoStatus
): "default" | "warning" | "success" | "error" {
    if (status === "ready") return "success";
    if (status === "indexing" || status === "new") return "warning";
    if (status === "error") return "error";
    return "default";
}

export const RepoSidebar = observer(function RepoSidebar() {
    const repos = repoStore;
    //const navigate = useNavigate();
    const { repoId } = useParams<{ repoId: string }>();

    const [url, setUrl] = useState("");
    const [snack, setSnack] = useState<string | null>(null);

    const selectedRepoId = repoId ? Number(repoId) : null;

    const sorted = useMemo(() => {
        const prio = (s: RepoStatus) =>
            s === "indexing" || s === "new" ? 0 : s === "ready" ? 1 : 2;

        return [...repos.repos].sort(
            (a, b) => prio(a.status) - prio(b.status)
        );
    }, [repos.repos]);

    async function onAdd() {
        try {
            const created = await repos.createRepo({ url });
            setUrl("");
            setSnack("Repository added");

            //navigate(`app/repos/${created.id}`);
        } catch {
            setSnack("Failed to add repository");
        }
    }

    function onSelect(r: Repo) {
        // 🔑 только навигация, без бизнес-логики
        //navigate(`/repos/${r.id}`);
    }

    useEffect(() => {
        void repos.loadRepos();
        return () => repos.dispose();
    }, [repos]);

    return (
        <Box sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Repositories
                </Typography>

                <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                        size="small"
                        label="GitHub repo URL"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        fullWidth
                    />
                    <Button variant="contained" onClick={onAdd} disabled={!url.trim()}>
                        Add
                    </Button>
                </Box>
            </Box>

            <Divider />

            {repos.error && <Alert severity="error">{repos.error}</Alert>}

            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                <List dense>
                    {sorted.map((r) => (
                        <ListItemButton
                            key={r.id}
                            selected={r.id === selectedRepoId}
                            onClick={() => onSelect(r)}
                            sx={{ alignItems: "flex-start" }}
                        >
                            <ListItemText
                                primary={
                                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                        <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                                            {r.url}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={r.status}
                                            color={statusColor(r.status)}
                                        />
                                    </Box>
                                }
                                secondary={
                                    r.status === "error" && r.last_error ? (
                                        <Typography variant="caption" color="error">
                                            {r.last_error}
                                        </Typography>
                                    ) : null
                                }
                            />
                        </ListItemButton>
                    ))}
                </List>
            </Box>

            <Snackbar
                open={Boolean(snack)}
                autoHideDuration={2500}
                onClose={() => setSnack(null)}
            >
                <Alert severity="info" onClose={() => setSnack(null)}>
                    {snack}
                </Alert>
            </Snackbar>
        </Box>
    );
});

export default RepoSidebar;

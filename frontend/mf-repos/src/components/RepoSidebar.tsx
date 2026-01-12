import React, { useEffect, useMemo, useState } from "react";
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
    Alert,
} from "@mui/material";
import { repoStore } from "../app/store";
import {Repository} from "@rag/shared";

function statusColor(status?: string): "default" | "warning" | "success" | "error" {
    if (status === "done") return "success";
    if (status === "processing" || status === "queued") return "warning";
    if (status === "failed") return "error";
    return "default";
}

export const RepoSidebar = observer(function RepoSidebar() {
    const repos = repoStore;
    const navigate = useNavigate();
    const { repoId } = useParams<{ repoId: string }>();

    const [url, setUrl] = useState("");
    const [snack, setSnack] = useState<string | null>(null);

    const selectedRepoId = repoId ? Number(repoId) : null;

    const sorted = useMemo(() => {
        const prio = (s?: string) => (s === "queued" || s === "processing" ? 0 : s === "done" ? 1 : 2);
        return [...repos.repos].sort((a, b) => prio(a.index_state?.status) - prio(b.index_state?.status));
    }, [repos.repos]);

    async function onAdd() {
        try {
            const created = await repos.startIndexing(url);
            setUrl("");
            setSnack("Repository indexing started");
            navigate(`/app/repos/${created.id}`);
        } catch (e) {
            setSnack(e instanceof Error ? e.message : "Failed to add repository");
        }
    }

    function onSelect(r: Repository) {
        navigate(`/app/repos/${r.id}`);
    }

    useEffect(() => {
        void repos.init();
        return () => repos.dispose();
    }, [repos]);

    return (
        <Box sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
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
                        INDEX
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
                                            {r.slug}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={r.index_state?.status ?? "unknown"}
                                            color={statusColor(r.index_state?.status)}
                                        />
                                    </Box>
                                }
                                secondary={
                                    r.index_state?.status === "error" && r.index_state.last_error ? (
                                        <Typography variant="caption" color="error">
                                            {r.index_state.last_error}
                                        </Typography>
                                    ) : null
                                }
                            />
                        </ListItemButton>
                    ))}
                </List>
            </Box>

            <Snackbar open={Boolean(snack)} autoHideDuration={2500} onClose={() => setSnack(null)}>
                <Alert severity="info" onClose={() => setSnack(null)}>
                    {snack}
                </Alert>
            </Snackbar>
        </Box>
    );
});

export default RepoSidebar;

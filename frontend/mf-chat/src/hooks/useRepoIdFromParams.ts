import { useMemo } from "react";
import { useParams } from "react-router-dom";

export function useRepoIdFromParams() {
    const { repoId } = useParams<{ repoId?: string }>();

    return useMemo(() => {
        if (!repoId) return null;
        const n = Number(repoId);
        return Number.isFinite(n) ? n : null;
    }, [repoId]);
}
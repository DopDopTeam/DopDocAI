import tempfile
from dataclasses import dataclass
from pathlib import Path

from git import Repo


class RepoCloneError(RuntimeError):
    pass


@dataclass(frozen=True)
class CloneResult:
    path: Path


class GitClient:
    """
    Thin wrapper around GitPython to make cloning testable/mocked and to keep
    git-specific details out of the HTTP layer.
    """

    def clone(self, repo_url: str, branch: str | None = None) -> Path:
        try:
            temp_dir = Path(tempfile.mkdtemp(prefix="repo_"))
            if branch:
                Repo.clone_from(repo_url, temp_dir, branch=branch)
            else:
                Repo.clone_from(repo_url, temp_dir)
            return temp_dir
        except Exception as e:
            # keep error message, but wrap it for domain-level handling
            raise RepoCloneError(f"Failed to clone repo {repo_url!r}: {e}") from e

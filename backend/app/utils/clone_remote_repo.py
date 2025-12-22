import tempfile
from git import Repo
from pathlib import Path


def clone_remote_repo(repo_url: str, branch: str | None = None) -> Path:
    temp_dir = Path(tempfile.mkdtemp(prefix="repo_"))

    if branch:
        Repo.clone_from(repo_url, temp_dir, branch=branch)
    else:
        Repo.clone_from(repo_url, temp_dir)

    return temp_dir

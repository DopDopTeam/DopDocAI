from urllib.parse import urlparse

def repo_url_to_slug(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.netloc.replace(".", "_")

    path_parts = [p for p in parsed.path.split("/") if p]
    return "_".join([host] + path_parts)

def get_repo_name(url: str) -> str:
    return urlparse(url).path.rstrip("/").split("/")[-1]
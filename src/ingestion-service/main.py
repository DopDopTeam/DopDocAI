import os
from pathlib import Path
import hashlib
from typing import List, Tuple

import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer
import torch

from treesitter import TreeSitterManager
from qdrant import QdrantManager

# ---------------- config / models ----------------
JINA_MODEL = "jinaai/jina-code-embeddings-0.5b"
device = "cuda" if torch.cuda.is_available() else "cpu"

model = SentenceTransformer(
    JINA_MODEL,
    device=device,
    model_kwargs={"dtype": torch.bfloat16},
    tokenizer_kwargs={"padding_side": "left"},
)

tokenizer = AutoTokenizer.from_pretrained(JINA_MODEL, trust_remote_code=True, use_fast=True)

# ---------------- utilities ----------------
def file_sha1_text(text: str) -> str:
    return hashlib.sha1(text.encode('utf-8')).hexdigest()


def count_tokens(text: str) -> int:
    """
    Use the model tokenizer to count tokens for chunking.
    This is more accurate than tiktoken for Jina models.
    """
    # don't truncate here — only count
    tokens = tokenizer(text, return_attention_mask=False, add_special_tokens=True)
    return len(tokens["input_ids"])


def is_binary(path: Path) -> bool:
    # quick heuristic
    try:
        with open(path, "rb") as f:
            chunk = f.read(1024)
            if b"\0" in chunk:
                return True
            # high non-text ratio
            nontext = sum(1 for b in chunk if b < 9 or (b > 13 and b < 32))
            return (nontext / max(1, len(chunk))) > 0.3
    except Exception:
        return True


# ---------------- traversal ----------------
def iterate_source_files(root: Path, extentions: List[str] = None, exclude_dirs: List[str] = None):
    """
    Iterator function, returns appropriate files
    """
    if extentions is None:
        extentions = [".go", ".mod", ".md", ".yaml", ".yml", ".json", ".toml", ".ts", ".tsx", ".css", ".html"]
    if exclude_dirs is None:
        exclude_dirs = [".git", "vendor", "node_modules", "bin", ".venv", "__pycache__"]
    for path in root.rglob("*"):
        if path.is_file():
            if any(part in exclude_dirs for part in path.parts):
                continue
            # special-case Dockerfile and other name-based files (no suffix)
            if path.name == "Dockerfile" or path.suffix.lower() in extentions:
                if not is_binary(path):
                    yield path


# ---------------- chunking ----------------
def chunk_text_by_tokens(text: str, max_tokens: int = 512, overlap: int = 64) -> List[Tuple[int, int, str]]:
    """
    Returns list of (start_token_index, end_token_index, chunk_text)
    using the tokenizer so indices align with tokenization used for embeddings.
    This implementation is simple: it tokenizes then decodes token slices.
    """
    if max_tokens <= 0:
        raise ValueError("max_tokens must be > 0")
    if overlap >= max_tokens:
        overlap = max(1, max_tokens - 1)

    # tokenize (get ids)
    enc = tokenizer(text, return_tensors=None, add_special_tokens=True, truncation=False)
    token_ids = enc["input_ids"]
    n = len(token_ids)
    if n == 0:
        return []

    chunks = []
    i = 0
    while i < n:
        j = min(i + max_tokens, n)
        # Take slice [i:j)
        chunk_tok_ids = token_ids[i:j]
        # decode token slice back to string
        chunk_text = tokenizer.decode(chunk_tok_ids, skip_special_tokens=True, clean_up_tokenization_spaces=False)
        chunks.append((i, j, chunk_text))

        # If we reached the end, break (prevents reset to 0)
        if j >= n:
            break

        # advance - ensure progress (j - overlap > i)
        next_i = j - overlap
        if next_i <= i:
            # fallback: ensure at least move by 1 token to avoid infinite loop
            next_i = i + 1
        i = next_i

    # return token index ranges and chunk text; caller currently uses only chunk_text.
    return chunks


# ---------------- main pipeline ----------------
def process_repo_and_upsert_qdrant(root_path: str,
                                   ts_mgr: TreeSitterManager,
                                   q_mgr: QdrantManager,
                                   max_tokens: int = 512,
                                   overlap: int = 64):
    root = Path(root_path)
    repo_name = root.name

    for file_path in iterate_source_files(root):
        try:
            text = file_path.read_text(encoding="utf-8", errors="ignore")
            print(f"DEBUG: Processing {file_path.relative_to(root)}")
        except Exception as e:
            print(f"Skipping {file_path}: read error: {e}")
            continue

        file_hash = file_sha1_text(text)
        rel_path = str(file_path.relative_to(root))
        if file_path.name == "Dockerfile":
            language = "Dockerfile"
        else:
            language = file_path.suffix.lstrip(".")
        chunks_texts: List[Tuple] = []

        # ask TreeSitterManager for entities/block extraction
        if language == "go":
            file_data = ts_mgr.extract_go_entities(text, file_path)

            package = file_data["package"] or "" # empty string if None
            imports = "\n".join(file_data["imports"])
            entities = file_data["entities"]

            for entity in entities:
                if count_tokens(entity["src"]) > max_tokens:
                    small_chunks = chunk_text_by_tokens(entity["src"], max_tokens=max_tokens, overlap=overlap)
                    for s_tok, e_tok, ctext in small_chunks:
                        chunks_texts.append((rel_path,
                                             package,
                                             imports,
                                             entity["kind"],
                                             entity["name"],
                                             entity["start"],
                                             entity["end"],
                                             ctext))
                else:
                    chunks_texts.append((rel_path,
                                         package,
                                         imports,
                                         entity["kind"],
                                         entity["name"],
                                         entity["start"],
                                         entity["end"],
                                         entity["src"]))
        else:
            # fallback to file-level chunking
            for s_tok, e_tok, ctext in chunk_text_by_tokens(text, max_tokens, overlap):
                chunks_texts.append((rel_path, "", "", "", "", "", "", ctext))

        sentences = [ct[7] for ct in chunks_texts]
        if not sentences:
            continue

        embeddings = model.encode(
            sentences,
            prompt_name="code2code_document",
            show_progress_bar=True,
            convert_to_numpy=True
        )
        if isinstance(embeddings, list):
            embeddings = np.array(embeddings)
        if embeddings.ndim == 1:
            embeddings = embeddings.reshape(1, -1)

        for idx, (rel_path, package, imports, kind, name, start, end, src) in enumerate(chunks_texts):
            if language == "go":
                metadata = {
                    "repo": repo_name,
                    "file_path": rel_path,
                    "language": language,
                    "package": package,
                    "imports": imports,
                    "kind": kind,
                    "name": name,
                    "start_code_line": start,
                    "end_code_line": end,
                    "chunk_index": idx,
                    "body": src
                }
            else:
                metadata = {
                    "repo": repo_name,
                    "file_path": rel_path,
                    "language": language,
                    "chunk_index": idx,
                    "body": src
                }
            vector = embeddings[idx].astype(float).tolist()
            q_mgr.add_point_from_vector(file_hash=file_hash, chunk_index=idx, vector=vector, payload=metadata)

    # flush any remaining points after processing all files
    q_mgr.flush()
    return q_mgr.total_upserted


def search_qdrant_by_query(model, qmgr, query_text: str, top_k: int = 10, prompt_name: str = "nl2code_query"):
    """
    model: SentenceTransformer instance
    qmgr: your QdrantManager instance (must expose qmgr.client)
    Returns list of dicts: {id, score, payload, vector, cosine}
    """
    # 1) get query embedding (numpy)
    q_emb = model.encode([query_text], convert_to_numpy=True, show_progress_bar=False, prompt_name=prompt_name)[0]

    # normalize (if you normalized when upserting)
    q_emb = q_emb / np.maximum(np.linalg.norm(q_emb), 1e-12)

    # 2) query Qdrant
    # with_vector=True to get stored vector back (optional)
    results = qmgr.client.search(
        collection_name=qmgr.collection_name,
        query_vector=q_emb.tolist(),
        limit=top_k,
        with_payload=True,
    )

    # 3) results -> friendly list
    out = []
    for hit in results:
        # hit.id, hit.payload, hit.vector, hit.score (distance or similarity depending on setup)
        stored_vec = np.array(hit.vector) if hasattr(hit, "vector") and hit.vector is not None else None

        # compute cosine ourselves if stored_vec is available and normalized
        cosine = None
        if stored_vec is not None:
            stored_vec = stored_vec / np.maximum(np.linalg.norm(stored_vec), 1e-12)
            cosine = float(np.dot(q_emb, stored_vec))

        out.append({
            "id": hit.id,
            "score": getattr(hit, "score", None),
            "payload": hit.payload,
            "vector": stored_vec,
            "cosine": cosine,
        })

    return out


if __name__ == "__main__":
    root = "LOCAL_PATH_TO_REPO"

    QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
    QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", None)  # if needed
    COLLECTION_NAME = "repo_code"

    qdrant_manager = QdrantManager(QDRANT_URL, QDRANT_API_KEY, COLLECTION_NAME)
    ts_manager = TreeSitterManager()

    qdrant_manager.init_collection(896) # default embedding vector dimension for jina-code-embeddings-0.5b

    n = process_repo_and_upsert_qdrant(root, ts_manager, qdrant_manager, max_tokens=512, overlap=64)
    print(f"Upserted {n} chunks into Qdrant collection '{COLLECTION_NAME}'.")

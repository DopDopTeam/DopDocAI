# Project Spec: GitHub Repository RAG (MVP)

## 1. Project Overview

This project is a **Retrieval-Augmented Generation (RAG) system for public GitHub repositories**.

The system allows a user to:

1. Provide a **public GitHub repository URL**
2. Trigger **one-time indexing on demand**
3. Ask questions about the repository via a **chat interface**
4. Receive answers **strictly grounded in the repository content**, with **explicit sources (file + line ranges)**

The project is designed as a **1-week MVP**, prioritizing correctness, simplicity, and debuggability over completeness.

---

## 2. Scope and Explicit Non-Goals

### In Scope

* Public GitHub repositories only
* One-time indexing per repository (no auto-sync)
* Go source code (`.go`) + `README.md`
* Hybrid RAG:

  * **Structured chunks for Go code**
  * **Text chunks for README**
* Web UI with two-panel layout:

  * Left: repositories & indexing
  * Right: chat
* Answers must include **sources**
* Answers must be **strictly based on retrieved context**

### Explicitly Out of Scope

* Private repositories / authentication
* PRs, Issues, Wiki, Discussions
* Tool usage (no function calls, no file opening tools)
* Multi-user auth / permissions
* Advanced ranking (cross-encoders, AST graphs, call graphs)
* Streaming responses
* Real-time indexing progress bars

---

## 3. High-Level Architecture

### Frontend

* **React + Vite**
* Two-panel layout:

  * Left: repository management
  * Right: chat interface
* Communicates with backend via REST API

### Backend

* **FastAPI**
* Responsibilities:

  * Repository cloning
  * Indexing (parsing, chunking, embedding)
  * Retrieval
  * Chat orchestration
* No tool usage inside LLM calls

### Storage

* **Qdrant** — vector storage for chunks
* **PostgreSQL** — metadata & chat history

---

## 4. Data Model

### 4.1 PostgreSQL Schema (MVP)

#### `repos`

* `id` (UUID, PK)
* `url` (TEXT)
* `status` (`new | indexing | ready | error`)
* `last_commit_sha` (TEXT, nullable)
* `last_error` (TEXT, nullable)
* `created_at`
* `updated_at`

#### `chats`

* `id` (UUID, PK)
* `repo_id` (FK → repos.id)
* `created_at`

#### `messages`

* `id` (UUID, PK)
* `chat_id` (FK → chats.id)
* `role` (`user | assistant | system`)
* `content` (TEXT)
* `created_at`

---

## 5. Vector Store Design (Qdrant)

Single collection, multiple document kinds.

### Common Payload Fields

* `repo_id` (UUID)
* `commit_sha` (string)
* `kind` (`go_symbol` | `readme_chunk`)
* `path` (string)
* `text` (string)
* `start_line` (int)
* `end_line` (int)

### 5.1 Go Code Chunks (`kind = "go_symbol"`)

Chunk unit: **function or method** (optionally types later).

Additional payload:

* `symbol_type`: `func | method | type`
* `symbol_name`: string
* `package`: string
* `signature`: string

Text content:

* Leading comments (if any)
* Function/method signature
* Full body (may be truncated if extremely large)

### 5.2 README Chunks (`kind = "readme_chunk"`)

* Chunked by Markdown headers
* Size limit: ~1500–2500 characters with overlap
* Retains line number mapping

---

## 6. Indexing Pipeline

### Step 1: Clone Repository

* `git clone --depth 1 <repo_url>`
* Resolve HEAD commit SHA

### Step 2: File Filtering

Include:

* `**/*.go`
* `README.md`

Exclude:

* `.git/`
* `vendor/`
* `node_modules/`
* `dist/`, `bin/`
* Binary files

### Step 3: Chunking

#### Go Code

* Use `tree-sitter-go` or Go parser
* Extract:

  * Functions
  * Methods
* Preserve line ranges

#### README

* Chunk by headers
* Enforce max chunk size

### Step 4: Embeddings

* Generate embeddings for each chunk
* Batch upsert into Qdrant with payload

### Step 5: Finalize

* Update repo status to `ready`
* Save commit SHA

---

## 7. Retrieval Strategy (Hybrid, Simple)

No BM25, no rerankers.

### Query Classification (Lightweight Heuristics)

* If query mentions:

  * `run`, `deploy`, `docker`, `install` → bias README
  * `where`, `implemented`, `function`, `method` → bias Go symbols
* Default: balanced

### Retrieval Flow

1. Vector search:

   * `go_symbol` chunks (top K1)
   * `readme_chunk` chunks (top K2)
2. Merge results
3. Remove duplicates
4. Enforce max total context size

---

## 8. LLM Answering Policy (Critical)

### Core Rules

* **Use ONLY the provided context**
* **Do NOT infer or guess**
* **If information is missing, explicitly say so**
* **Always include sources**

### Source Format

Each answer must include a `Sources` section:

```
Sources:
- internal/server/http.go:45–88
- README.md:12–34
```

### Failure Mode

If no sufficiently relevant context is found:

> “I could not find this information in the repository based on the indexed files.”

---

## 9. API Endpoints

### Repositories

* `POST /repos`

  * `{ url: string }`
* `GET /repos`
* `GET /repos/{repo_id}`

### Indexing Status

* `GET /repos/{repo_id}/status`

### Chat

* `POST /chats`

  * `{ repo_id }`
* `GET /chats/{chat_id}/messages`
* `POST /chats/{chat_id}/messages`

  * `{ content: string }`
  * Returns:

    * `answer`
    * `sources[]`

---

## 10. Frontend UX Requirements

### Layout

* Two-panel UI:

  * Left: repository list + index form
  * Right: chat

### Chat Behavior

* Message history per repository
* Textarea input
* Messages rendered sequentially
* Assistant messages include expandable **Sources**

### UX Principles

* No empty ambiguity
* Clear error states
* Visible indexing status
* Trust through transparency (sources always shown)

---

## 11. Development Constraints

* Target timeline: **7 days**
* Prioritize:

  * Correctness
  * Deterministic behavior
  * Debuggability
* Avoid:

  * Over-engineering
  * Premature optimizations
  * Feature creep

---

## 12. Guiding Principle

> This system is not a “smart assistant”.
>
> It is a **grounded interface over a codebase**.
>
> Silence and “I don’t know” are better than confident hallucination.

---

Если хочешь, следующим шагом я могу:

* превратить этот документ в **System Prompt** для LLM (короче, но жёстче),
* или разбить его на **Backend Spec / Frontend Spec / Prompt Spec**,
* или сразу сгенерировать **скелет репозитория** (backend + frontend + compose).

Ты сейчас в очень хорошей позиции: с таким контекстом LLM реально начинает *помогать*, а не фантазировать.

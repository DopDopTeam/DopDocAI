# Project Specification

## GitHub Repository RAG Platform (Microservices + Microfrontends)

---

## 1. Project Overview

This project is a **web-based Retrieval-Augmented Generation (RAG) platform** for analyzing **public GitHub repositories**.

The system allows users to:

1. Authenticate via JWT
2. Submit a **public GitHub repository URL**
3. Trigger **on-demand, one-time indexing**
4. Ask questions about the repository through a chat interface
5. Receive answers **strictly grounded in the repository content**, with **explicit sources (file + line ranges)**

The platform is built using:

* **Microservices (FastAPI)**
* **Microfrontends (React)**
* **Vector search (Qdrant)**
* **Relational storage (PostgreSQL)**
* **Cloud-native infrastructure (Kubernetes + Helm)**

This specification prioritizes:

* determinism over creativity,
* traceability over “smartness”,
* production-ready architecture over demo hacks.

---

## 2. Scope and Non-Goals

### In Scope

* Public GitHub repositories only
* One-time indexing triggered manually
* Go source code (`.go`) and `README.md`
* Hybrid RAG:

  * structured chunks for Go code
  * text chunks for README
* JWT-based authentication
* HTTPS-only communication
* Microfrontend architecture
* Observability (metrics + logs)
* Kubernetes deployment

### Explicit Non-Goals

* Private repositories
* GitHub Issues / PRs / Wiki / Discussions
* Tool-usage by LLM (no file-open, no search tools)
* Real-time collaboration
* Advanced semantic reranking (cross-encoders)
* Call-graph or control-flow analysis
* Automatic reindexing on repo updates

---

## 3. High-Level Architecture

### Frontend

* **Microfrontends**
* React 18
* React Router (routing)
* MobX (state management)
* Material UI (UI components)
* Axios (HTTP client)

### Backend

* **Microservices**
* Core framework: **FastAPI (Python)**
* Services communicate via REST
* JWT authentication
* Stateless services

### Data & Storage

* **PostgreSQL** — metadata, users, chats
* **Qdrant** — vector embeddings
* No embedding data stored in Postgres

### Infrastructure

* Kubernetes
* Helm
* GitHub Actions (CI/CD)
* Prometheus + Grafana (metrics)
* Loki (logs)

---

## 4. Frontend Architecture (Microfrontends)

### Structure

* **Host / Shell application**

  * Top-level routing
  * Auth guard
  * Global MUI theme
  * Shared state (selected repo/chat)
* **mf-repos**

  * Repository indexing UI
  * Repository list + status
* **mf-chat**

  * Chat interface
  * Messages and sources

Microfrontends must be:

* independently buildable
* independently deployable
* integrated via module federation (or equivalent)

### Routing

* `/login` — authentication
* `/app` — protected application

  * Two-panel layout:

    * Left: repositories
    * Right: chat

---

## 5. Authentication & Security

### Authentication

* JWT-based authentication
* Access token stored in localStorage (MVP assumption)
* Axios interceptor injects:

  ```
  Authorization: Bearer <token>
  ```

### Authorization Behavior

* If token missing or invalid → redirect to `/login`
* On HTTP 401:

  * clear token
  * force logout

### Transport Security

* HTTPS enforced at ingress / load balancer
* Frontend assumes HTTPS API endpoint via environment variables

---

## 6. Backend Microservices (Logical View)

### Core Services

1. **Auth Service**

   * Login
   * JWT issuance

2. **Repository Service**

   * Register repository
   * Track indexing status
   * Store repo metadata

3. **Indexing / RAG Service**

   * Clone repository
   * Parse Go + README
   * Chunk content
   * Generate embeddings
   * Store vectors in Qdrant

4. **Chat Service**

   * Manage chats
   * Store messages
   * Perform retrieval
   * Call LLM

Services communicate via REST and share JWT-based auth.

---

## 7. Data Model (PostgreSQL)

### users

* `id` (UUID)
* `username`
* `password_hash`
* `created_at`

### repos

* `id` (UUID)
* `url`
* `status` (`new | indexing | ready | error`)
* `last_commit_sha`
* `last_error`
* `created_at`
* `updated_at`

### chats

* `id` (UUID)
* `repo_id`
* `user_id`
* `created_at`

### messages

* `id` (UUID)
* `chat_id`
* `role` (`user | assistant`)
* `content`
* `created_at`

---

## 8. Vector Storage (Qdrant)

Single collection, multiple document types.

### Common Payload

* `repo_id`
* `commit_sha`
* `kind`
* `path`
* `text`
* `start_line`
* `end_line`

### Go Code Chunks (`kind = "go_symbol"`)

* `symbol_type` (`func | method | type`)
* `symbol_name`
* `package`
* `signature`

Chunk unit: **function or method**
Text includes comments + signature + body.

### README Chunks (`kind = "readme_chunk"`)

* Chunked by markdown headers
* Size-limited with overlap

---

## 9. Indexing Pipeline

1. Clone public GitHub repository (`--depth 1`)
2. Resolve HEAD commit SHA
3. Filter files:

   * include `.go`, `README.md`
   * exclude vendor, binaries, generated files
4. Chunk content:

   * structured Go symbols
   * markdown sections
5. Generate embeddings
6. Upsert into Qdrant
7. Update repository status

Indexing is **on-demand only**.

---

## 10. Retrieval Strategy (Hybrid)

No BM25, no tool-usage.

### Steps

1. Classify query intent (light heuristics)
2. Perform vector search:

   * Go symbols
   * README chunks
3. Merge and deduplicate results
4. Enforce context size limit

---

## 11. LLM Answering Policy (Critical)

### Rules

* Use **only retrieved context**
* Do not infer missing information
* If context insufficient → say so explicitly
* Always include sources

### Output Format

```
<answer text>

Sources:
- path/to/file.go:10–45
- README.md:12–30
```

Silence is preferred over hallucination.

---

## 12. Frontend UX Requirements

* Two-panel layout
* Repository indexing + status visibility
* Chat disabled while indexing
* Optimistic UI for user messages
* Assistant placeholder (“Думаю…”)
* Sources shown for every assistant response
* Clear error states

---

## 13. Observability

### Metrics

* Request latency
* Indexing duration
* Vector search latency
* LLM request count

Collected via **Prometheus**, visualized in **Grafana**.

### Logging

* Structured logs
* Centralized via **Loki**
* Correlation IDs across services

---

## 14. CI/CD

### GitHub Actions

* Linting
* Tests
* Docker image build
* Push to registry

### Deployment

* Kubernetes
* Helm charts per service
* Values per environment

---

## 15. Guiding Principles

> This system is a **grounded analytical interface**, not a creative assistant.

> If the answer cannot be proven by the repository — the correct answer is “I don’t know”.

---

## 16. Intended Usage of This Document

This document is designed to be:

* passed verbatim to an LLM as **project context**
* used as a **single source of truth**
* referenced during frontend, backend, infra, and CI development

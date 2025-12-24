# syntax=docker/dockerfile:1.6
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    POETRY_VERSION=1.8.3

# System deps (git нужен для GitPython clone; build-essential иногда нужен для wheels)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    build-essential \
  && rm -rf /var/lib/apt/lists/*

# Install poetry
RUN pip install "poetry==${POETRY_VERSION}"

WORKDIR /app/backend/ingestion_service

# Copy only dependency files first for better layer caching
COPY backend/ingestion_service/pyproject.toml backend/ingestion_service/poetry.lock* ./

# Install deps (no venv inside container)
RUN poetry config virtualenvs.create false \
  && poetry install --only main --no-interaction --no-ansi

# Copy the service code
COPY backend/ingestion_service/ ./

# Optional: copy alembic config if it sits here (recommended)
# (already included by COPY above)

EXPOSE 8000

# Default command: run migrations then start server
# For local dev you might want to disable auto-migration and run manually.
CMD ["bash", "-lc", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]

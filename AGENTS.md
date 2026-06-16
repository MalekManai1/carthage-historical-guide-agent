# AGENTS.md — Règles pour Cursor

## Project Goal

Build an autonomous MVP for a historical guide RAG agent focused on Carthage, Tunisia.

The project contains:

- FastAPI backend
- PostgreSQL + pgvector
- Excel ingestion
- RAG pipeline
- Historical guide agent
- Memory agent
- Simple interface or Swagger for testing

## Main Scope

The project focuses on two agents:

1. Historical Guide Agent
2. Memory Agent

The project must work independently during the internship, but it should be designed so it can be integrated later into a larger multi-agent orchestration system.

---

## Core Rules

- Keep the MVP simple and testable.
- Use PostgreSQL + pgvector, not Qdrant.
- Use FastAPI for backend APIs.
- Use SQLAlchemy for database access.
- Use Alembic for migrations.
- Keep business logic outside API route files.
- Always return sources for RAG answers.
- The historical agent must not answer unsupported facts without context.
- The memory agent should store only useful session-level preferences.
- Prefer clear code over clever code.
- Do not implement optional features before the MVP is stable.
- Do not invent dataset columns.
- Handle missing values safely.
- Use type hints in Python.
- Use Pydantic schemas for request and response payloads.

---

## Main Flow

`POST /api/chat`

1. Receive `session_id`, `message`, and `language`.
2. Load memory context.
3. Retrieve relevant historical chunks from PostgreSQL/pgvector.
4. Generate a grounded answer.
5. Update memory.
6. Return answer, sources, suggested actions, and memory context.

---

## Required Response Format for Chat

The `/api/chat` endpoint should return:

```json
{
  "session_id": "session_001",
  "answer": "...",
  "sources": [
    {
      "source_type": "monument",
      "source_id": 12,
      "title": "Thermes d’Antonin",
      "score": 0.89
    }
  ],
  "memory_context": {
    "preferred_language": "fr",
    "interests": ["romain"],
    "available_time_minutes": 90,
    "last_mentioned_monuments": ["Thermes d’Antonin"]
  },
  "suggested_actions": [
    "Afficher les horaires",
    "Proposer un circuit romain"
  ]
}
```

---

## Do Not Implement Yet

Do not implement these before the core MVP is stable:

- Reservation
- Weather
- Advanced circuit optimization
- Advanced scraping
- Full Three.js
- Full PostGIS
- Complex multilingual system
- Qdrant
- Complex frontend

---

## Preferred Development Order

1. FastAPI skeleton
2. PostgreSQL + pgvector Docker setup
3. SQLAlchemy models
4. Alembic migrations
5. Excel ingestion
6. API endpoints for monuments and circuits
7. RAG documents
8. Embeddings
9. Retriever
10. Historical agent
11. Memory agent
12. Local orchestrator
13. `/api/chat`
14. Tests
15. Documentation
16. Simple frontend only if backend is stable

---

## Coding Standards

- Python 3.11+
- Explicit type hints
- Pydantic schemas for input/output
- SQLAlchemy models for DB entities
- Services for business logic
- Routes should be thin
- Use `.env` for configuration
- Use clear names
- Avoid unnecessary abstractions
- Keep functions small
- Add error handling around database and file operations
- Add basic logging where useful

---

## Architecture Boundary

This project should include a local orchestrator only for standalone testing.

The real future orchestrator is outside this MVP.

The `LocalOrchestrator` should only:

1. Load memory context.
2. Call the historical agent.
3. Update memory.
4. Return formatted output.

Do not build a complex multi-agent orchestrator.

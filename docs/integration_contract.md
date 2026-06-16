# Integration Contract — Historical Guide RAG Agent

This document defines the public contract for integrating the MVP into a future external orchestrator.

## Scope

**In scope:** historical Q&A about Carthage monuments and circuits, session memory, grounded answers with sources.

**Out of scope:** reservation, weather, advanced routing, multilingual orchestration, other agents.

## Primary endpoint

```http
POST /api/chat
Content-Type: application/json
```

### Request

```json
{
  "session_id": "session_001",
  "message": "Je veux visiter des monuments romains à Carthage",
  "language": "fr"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | string | yes | Stable session identifier (1–255 chars) |
| `message` | string | yes | User message (1–2000 chars) |
| `language` | string | no | ISO-like code, default `fr` |

### Response (200)

```json
{
  "session_id": "session_001",
  "answer": "À Carthage, plusieurs monuments permettent de découvrir l'époque romaine...",
  "sources": [
    {
      "source_type": "monument",
      "source_id": 12,
      "title": "Thermes d'Antonin",
      "score": 0.89
    },
    {
      "source_type": "web",
      "source_id": null,
      "title": "Fouilles récentes à Carthage",
      "url": "https://example.com/fouilles",
      "score": null
    }
  ],
  "memory_context": {
    "preferred_language": "fr",
    "interests": ["romain"],
    "available_time_minutes": 90,
    "mobility_mode": "walking",
    "last_mentioned_monuments": ["Thermes d'Antonin"],
    "primary_site_id": 3,
    "primary_site_name": "Parc des thermes d'Antonin"
  },
  "suggested_actions": [
    "Afficher les horaires",
    "Proposer un circuit romain"
  ]
}
```

### Error responses

| Status | When | `detail` |
|--------|------|----------|
| 400 | Invalid request (empty message, etc.) | Validation message |
| 503 | LLM provider failure or missing API key | French user-facing message |
| 500 | Unexpected server error | Generic French message |

## Session semantics

- `session_id` is the external identifier; the module creates DB rows on first use.
- Memory persists across requests with the same `session_id`.
- Preferences are extracted by rules (interests, time budget, mobility) — not by a separate LLM call.
- `last_mentioned_monuments` and `primary_site_id` enable attribute follow-ups (horaires, tarifs).

## Grounding rules

- Answers must be based primarily on retrieved `document_chunks`.
- If retrieval score is below `RAG_MIN_SCORE`, the agent returns a fixed insufficient-context message without calling the LLM, unless optional web search fallback is enabled.
- When `WEB_SEARCH_ENABLED=true`, web results may supplement local context for domain-related queries only; web information is not verified internal data.
- `sources` are returned from retrieval and may optionally include web sources (`source_type: "web"`).

## Health check

```http
GET /health
```

Response: `{"status": "ok"}`

## Configuration required by host

| Variable | Required for chat |
|----------|-------------------|
| `DATABASE_URL` | Yes |
| `LLM_API_KEY` | Yes (unless `LLM_PROVIDER=mock`) |
| Embeddings pre-generated | Yes |

## Future orchestrator integration

The external orchestrator should:

1. Route historical/tourism questions to `POST /api/chat`.
2. Pass through `session_id` from its own user session.
3. Display `sources` to the user.
4. Optionally use `suggested_actions` as UI hints.

The external orchestrator should **not** depend on internal classes (`LocalOrchestrator`, `HistoricalAgent`, etc.) — only the HTTP contract above.

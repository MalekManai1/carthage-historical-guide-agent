# Demo Guide — Historical Guide RAG Agent

## Pre-demo checklist

```text
[ ] docker compose up -d
[ ] DB healthy: docker compose ps
[ ] .env configured (DATABASE_URL, LLM_API_KEY)
[ ] Data loaded: monuments + document_chunks with embeddings
[ ] Backend running: uvicorn app.main:app --reload  (from backend/)
[ ] GET http://localhost:8000/health → {"status":"ok"}
[ ] Demo UI: http://localhost:8000/chat-ui  (no Node.js needed)
[ ] Optional React UI: requires Node.js — cd frontend/simple-chat-ui && npm run dev
```

### Quick data verification

```bash
cd backend
python scripts/evaluate_retrieval.py --case-id 1   # if --case-id added, or full run
python scripts/evaluate_chat.py --provider mock --case-id C01
```

## Demo scenarios (~15 minutes)

Use fixed `session_id` values for reproducibility.

### 1. Monument discovery (RAG + sources)

- **Session:** `demo_01`
- **Message:** *"Explique-moi les Thermes d'Antonin."*
- **Show:** Grounded answer, sources with Thermes/Parc des thermes, score ≥ 0.65.

### 2. Period interest (memory)

- **Session:** `demo_02`
- **Turn 1:** *"Je suis intéressé par l'architecture romaine."*
- **Turn 2:** *"Quels monuments me conseilles-tu ?"*
- **Show:** `memory_context.interests` updated; Roman monuments in answer.

### 3. Time-constrained visit

- **Session:** `demo_03`
- **Turn 1:** *"J'ai 1h30 pour visiter Carthage."*
- **Turn 2:** *"Propose-moi un parcours."*
- **Show:** `available_time_minutes: 90`; circuit or adapted suggestion.

### 4. Multi-turn follow-up (site memory)

- **Session:** `demo_04`
- **Turn 1:** *"Parle-moi du théâtre romain de Carthage."*
- **Turn 2:** *"Et quels sont les horaires ?"*
- **Show:** `last_mentioned_monuments` + horaires from sources only.

### 5. Robustness / refusal

- **Session:** `demo_05`
- **Messages:**
  - *"Quel temps fait-il demain à Carthage ?"*
  - *"Peux-tu réserver un billet pour les thermes ?"*
- **Show:** Clear refusal; no invented weather or booking.

### 6. Punic heritage

- **Session:** `demo_06`
- **Message:** *"Qu'est-ce que le Tophet de Carthage ?"*
- **Show:** Historical explanation + source `Tophet` + suggested actions.

## Talking points

1. **Autonomous MVP** — Historical + Memory agents with local orchestrator.
2. **Grounded RAG** — PostgreSQL/pgvector, hybrid retrieval, sources always returned.
3. **Measured quality** — Retrieval ~83% Top-1; 40-case chat evaluation suite.
4. **Session memory** — Interests, time budget, monument follow-ups without extra agents.
5. **Integration-ready** — `POST /api/chat` contract for future orchestrator.

## Fallback plan

If Groq API fails:

```bash
# In .env
LLM_PROVIDER=mock
```

Demo retrieval + memory flow with mock answers, or use Swagger `/docs` with pre-recorded screenshots.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 503 LLM error | Set `LLM_API_KEY` in `.env`, restart uvicorn |
| Empty sources | Re-run `generate_embeddings.py` |
| DB connection refused | `docker compose up -d`, check port 5433 |
| CORS error in UI | Backend must run with CORS origins for `localhost:5173` |

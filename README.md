# Historical Guide RAG Agent

MVP autonome pour un agent guide historique RAG centré sur Carthage, Tunisie.

## Features

- **Historical Guide Agent** — RAG-grounded answers with sources (Groq Llama 3.1)
- **Memory Agent** — Session preferences, monument follow-ups
- **Hybrid retrieval** — pgvector + keyword + intent scoring (~83% Top-1)
- **Optional web fallback** — DuckDuckGo search when local RAG is insufficient (disabled by default)
- **`POST /api/chat`** — Main integration endpoint
- **`POST /api/circuits/recommend`** — Algorithmic circuit recommendation (CircuitAgent)
- **Evaluation suite** — Retrieval (30 Q) + chat (40 cases)
- **Optional UI** — React/Vite chat + circuit planner in `frontend/simple-chat-ui/`

## Quick start

### 1. Database

```bash
docker compose up -d
cp .env.example .env
# Edit .env: set DATABASE_URL and LLM_API_KEY
```

### 2. Python environment

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
alembic upgrade head
```

### 3. Load data and embeddings

```bash
python scripts/ingest_excel.py
python scripts/import_circuit_datasets.py   # CircuitAgent graph + monuments CSV
python scripts/chunk_documents.py
python scripts/generate_embeddings.py
```

### 4. Run API

```bash
uvicorn app.main:app --reload
```

- Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/health

### 5. Test chat

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"test_01\",\"message\":\"Explique-moi les Thermes d'\''Antonin.\",\"language\":\"fr\"}"
```

### 6. Test circuit recommendation

```bash
curl -X POST http://localhost:8000/api/circuits/recommend \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"session_001\",\"type_tarif\":\"etudiant\",\"budget_max\":30,\"transport\":\"walking\",\"mobilite\":\"normale\",\"duration_minutes\":120,\"zone\":\"Carthage\",\"preferences\":{\"epoques\":[\"Romaine\"],\"fonctions\":[\"musee\"],\"must_visit\":[\"Thermes d'Antonin\"],\"avoid\":[]}}"
```

Or open the React UI → **Circuit** tab → **Créer mon circuit**.

See [docs/circuit_agent.md](docs/circuit_agent.md) and [docs/api_reference.md](docs/api_reference.md).

## Evaluation

```bash
cd backend

# Retrieval only (no LLM)
python scripts/evaluate_retrieval.py

# End-to-end chat (mock LLM)
python scripts/evaluate_chat.py --provider mock

# End-to-end chat (live Groq)
python scripts/evaluate_chat.py --provider groq

# Unit tests
pytest -q
```

Results: `data/processed/retrieval_eval_results.json`, `data/processed/chat_eval_results.json`

## Demo UI (no Node.js required)

With the API running:

```text
http://localhost:8000/chat-ui
```

Same chat interface served directly by FastAPI.

## React chat UI (ChatGPT-like, separate sessions)

**No system Node.js?** Use portable Node in the project:

```powershell
.\.tools\install-node.ps1
cd frontend\simple-chat-ui
.\run-dev.ps1
```

Or install Node.js LTS from https://nodejs.org/ then `npm install && npm run dev`.

Open http://localhost:5173 (API on port 8000). Use the **Circuit** nav item for the personalized circuit planner with map. See `frontend/simple-chat-ui/README.md`.

## Documentation

| Doc | Description |
|-----|-------------|
| [architecture.md](docs/architecture.md) | System design and components |
| [circuit_agent.md](docs/circuit_agent.md) | CircuitAgent (GA + Dijkstra) |
| [api_reference.md](docs/api_reference.md) | HTTP API reference |
| [rag_pipeline.md](docs/rag_pipeline.md) | Ingestion → embeddings → retrieval |
| [retrieval_evaluation.md](docs/retrieval_evaluation.md) | 30 retrieval test questions |
| [evaluation.md](docs/evaluation.md) | Full evaluation report |
| [integration_contract.md](docs/integration_contract.md) | API contract for future orchestrator |
| [demo.md](docs/demo.md) | Demo scenarios and checklist |
| [ROADMAP.md](ROADMAP.md) | Sprint plan |
| [AGENTS.md](AGENTS.md) | Cursor agent rules |

## Configuration

See `.env.example`. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | localhost:5433 | PostgreSQL + pgvector |
| `LLM_PROVIDER` | groq | `groq`, `openai`, `ollama`, or `mock` |
| `LLM_API_KEY` | — | Required for live LLM |
| `RAG_MIN_SCORE` | 0.65 | Minimum retrieval score to call LLM |
| `WEB_SEARCH_ENABLED` | false | Enable DuckDuckGo fallback web search |
| `WEB_SEARCH_PROVIDER` | duckduckgo | Web search provider |
| `WEB_SEARCH_MAX_RESULTS` | 3 | Max web results injected into prompt |
| `LOG_LEVEL` | INFO | Application logging |

### Optional web search fallback

Local RAG remains the primary source of truth. DuckDuckGo is used only when:

- `WEB_SEARCH_ENABLED=true`
- the query is related to Carthage / Tunisian heritage
- local retrieval is insufficient **or** the user explicitly asks to search online

To disable web search (default): leave `WEB_SEARCH_ENABLED=false`.

Limitations: DuckDuckGo requires no API key but results may be incomplete, rate-limited, or less reliable than internal dataset sources. Web sources are returned separately as `source_type: "web"`.

## Project structure

```
backend/
  app/           # FastAPI, agents, RAG, memory
  scripts/       # Ingestion, embeddings, evaluation
  tests/         # pytest suite
data/
  raw/           # Excel datasets
  eval/          # Chat evaluation questions
  processed/     # Evaluation result JSON
docs/            # Technical documentation
frontend/
  simple-chat-ui/  # Optional React chat
```

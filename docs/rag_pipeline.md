# RAG Pipeline — Historical Guide RAG Agent

## Pipeline overview

```
Excel datasets
  → ingest_excel.py          (SQLAlchemy models)
  → chunk_documents.py       (document_builder + chunker)
  → generate_embeddings.py   (E5 embeddings → pgvector)
  → SemanticRetriever        (hybrid search at query time)
  → HistoricalAgent          (prompt + LLM)
```

## 1. Data ingestion

**Script:** `backend/scripts/ingest_excel.py`

Imports from `data/raw/`:

- `Monuments.xlsx`
- `Tab_circuit.xlsx`
- `Tab_circuit_monument.xlsx`
- `Tab_destination.xlsx`

Populates `monuments`, `circuits`, `circuit_monuments`, `destinations`.

## 2. Document building

**Module:** `backend/app/rag/document_builder.py`

Builds French text documents per monument and circuit, including:

- Title, period, description
- Visit duration, accessibility, opening hours, prices
- Metadata: `source_type`, `source_id`, `period`, `site_id`, `destination_name`

**Script:** `backend/scripts/chunk_documents.py`

Chunks long texts and writes rows to `document_chunks`.

## 3. Embeddings

**Model:** `intfloat/multilingual-e5-small` (default)

**Module:** `backend/app/rag/embeddings.py`

- Query prefix: `query:`
- Passage prefix: `passage:`

**Script:** `backend/scripts/generate_embeddings.py`

Stores vectors in the `embedding` column (pgvector).

## 4. Retrieval (hybrid)

**Module:** `backend/app/rag/retriever.py`

```
query
  → detect_query_intent()       (monument / circuit / mixed)
  → embed_query()
  → pgvector cosine search      (top 10 candidates)
  → hybrid rerank               (vector + keyword + source_type)
  → dedupe by (source_type, source_id)
  → return top_k
```

**Scoring** (`backend/app/rag/scoring.py`):

```
final_score = 0.75 × vector + 0.15 × keyword + 0.10 × source_type
```

**Filters** (`RetrievalFilters`):

- `source_type`, `period`, `destination`, `language`, `site_id`

Memory context can set `period` from user interests (e.g. `romain` → `romaine`).

## 5. Generation

**Prompt:** `backend/app/rag/langchain_prompt.py` (LangChain `ChatPromptTemplate`)

**Agent:** `backend/app/agents/historical_agent.py`

- Post-filters chunks by score gap (max 3 chunks to LLM)
- Refuses when `best_score < RAG_MIN_SCORE` (default 0.65)
- Always returns `sources` from retrieval

## Evaluation scripts

| Script | Purpose |
|--------|---------|
| `scripts/evaluate_retrieval.py` | 30 retrieval questions (no LLM) |
| `scripts/evaluate_chat.py` | 40 end-to-end chat cases |

See `docs/retrieval_evaluation.md` and `docs/evaluation.md`.

## Tuning knobs

| Variable | Default | Effect |
|----------|---------|--------|
| `RAG_TOP_K` | 5 | Number of chunks retrieved |
| `RAG_MIN_SCORE` | 0.65 | Minimum score to call LLM |
| `EMBEDDING_MODEL_NAME` | e5-small | Embedding quality vs speed |
| Hybrid weights | 0.75/0.15/0.10 | In `scoring.py` |

## Rebuild procedure

From project root (DB running):

```bash
cd backend
python scripts/ingest_excel.py
python scripts/chunk_documents.py
python scripts/generate_embeddings.py
```

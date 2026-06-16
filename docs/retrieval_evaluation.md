# Retrieval Evaluation — Historical Guide RAG Agent

This document defines **30 evaluation questions** for testing semantic retrieval **before** connecting an LLM.

Use it with `SemanticRetriever` (`backend/app/rag/retriever.py`) to score whether the correct chunks are returned in the top results.

Since **Sprint 2.5**, retrieval uses **hybrid scoring** (vector + keyword + source-type intent). The public API is unchanged: `retrieve(query, top_k=5, filters=None)` still returns the same keys, with `score` now representing the hybrid final score.

---

## Retrieval pipeline (Sprint 2.5)

```
query
  → detect_query_intent()          # monument-like / circuit-like / mixed
  → embed_query() [E5 "query:" prefix]
  → pgvector cosine search         # top 10 candidates
  → hybrid rerank in Python        # vector + keyword + source_type
  → dedupe by (source_type, source_id)
  → return top_k (default 5)
```

### Query intent detection

Implemented in `backend/app/rag/query_intent.py`.

| Intent | Trigger | Effect on source_type score |
|--------|---------|----------------------------|
| **monument** | Monument keywords dominate (e.g. *monument*, *basilique*, *thermes*, *histoire*, *accessibilité*) | monuments → 1.0, circuits → 0.0 |
| **circuit** | Circuit keywords dominate (e.g. *circuit*, *parcours*, *demi-journée*, *vélo*) | circuits → 1.0, monuments → 0.0 |
| **mixed** | Tie or no keyword hit | all source types → 0.5 |

When `RetrievalFilters(source_type=...)` is set, intent is overridden to match the filter (monument or circuit).

### Keyword matching

Implemented in `backend/app/rag/text_utils.py`.

1. Normalize accents (NFKD), lowercase, strip punctuation.
2. Tokenize query, title, and chunk text (drop French stopwords and tokens ≤ 2 chars).
3. Score keyword overlap:
   - **1.0** — exact or strong title match
   - **0.75–1.0** — ≥ 60% of query tokens found in title
   - **0.45–0.90** — ≥ 50% token overlap with title + chunk text
   - lower partial overlap otherwise

### Hybrid scoring

Implemented in `backend/app/rag/scoring.py`.

```
final_score = 0.75 × vector_score + 0.15 × keyword_score + 0.10 × source_type_score
```

| Component | Range | Source |
|-----------|-------|--------|
| `vector_score` | 0–1 | pgvector cosine similarity (`1 - distance`) |
| `keyword_score` | 0–1 | token overlap with title / chunk_text |
| `source_type_score` | 0–1 | intent-based boost (see above) |

### API compatibility

`SemanticRetriever.retrieve()` signature is unchanged. Each result dict includes:

| Field | Description |
|-------|-------------|
| `score` | **Hybrid final score** (used for ranking) |
| `vector_score` | Raw pgvector score (debug / analysis) |
| `keyword_score` | Keyword overlap score |
| `source_type_score` | Intent boost component |

Existing callers that only read `score`, `title`, `source_type`, etc. continue to work.

---

## How to evaluate

### Run retrieval manually

```python
from app.database import SessionLocal
from app.rag.retriever import RetrievalFilters, SemanticRetriever

session = SessionLocal()
retriever = SemanticRetriever(session)

results = retriever.retrieve(
    "<question>",
    top_k=5,
    filters=RetrievalFilters(language="fr"),  # optional extra filters
)

# Hybrid debug fields (Sprint 2.5+)
print(results[0]["score"], results[0].get("vector_score"), results[0].get("keyword_score"))
```

### Run automated evaluation

From `backend/`:

```bash
python scripts/evaluate_retrieval.py
python scripts/evaluate_retrieval.py --verbose
python scripts/evaluate_retrieval.py --include-filters
python scripts/evaluate_retrieval.py --output ../data/processed/retrieval_eval_results.json
```

The script uses the same pass criteria below. It compares normalized titles against expected targets and writes JSON results to `data/processed/retrieval_eval_results.json`.

### Pass criteria (per question)

| Criterion | Pass |
|-----------|------|
| **Target in top 1** | Expected title appears as the **first** result |
| **Target in top 3** | Expected title appears in the **top 3** results |
| **Correct source_type** | At least one top-3 hit has the expected `source_type` |
| **Correct destination** | Metadata `destination_name` matches (see note below) |
| **Useful score** | Top hit `score >= 0.65` (hybrid final score) |

Record for each question: `top1_pass`, `top3_pass`, `actual_top1_title`, `actual_top1_score`.

When analyzing failures, inspect component scores:

```python
for hit in results[:3]:
    print(hit["title"], hit["score"], hit.get("vector_score"), hit.get("keyword_score"), hit.get("source_type_score"))
```

### Known limitation — destination metadata

Monument and circuit chunks currently store `"destination_name": "Carthage"` for all rows (hardcoded in `document_builder.py`). Questions targeting **La Marsa** circuits should still retrieve the correct **circuit title**, but the `destination` filter will not distinguish La Marsa until metadata is improved.

---

## Scoring template

| Q# | Category | Top-1 pass | Top-3 pass | Top-1 score | Notes |
|----|----------|:----------:|:----------:|------------:|-------|
| 1  | …        | ☐          | ☐          |             |       |

**Suggested aggregate metrics:**

- **Top-1 accuracy** = questions with correct target at rank 1 / 30
- **Top-3 recall** = questions with correct target in top 3 / 30
- **Mean top-1 score** across all questions

---

## Evaluation questions

### Roman monuments (5)

| Q# | Question | Expected retrieval target | Expected source_type | Expected destination |
|----|----------|---------------------------|----------------------|----------------------|
| 1 | Quels sont les thermes romains à Carthage ? | Thermes d'Antonin | monument | Carthage |
| 2 | Où se trouve le théâtre romain de Carthage ? | Theatre | monument | Carthage |
| 3 | Je veux voir un amphithéâtre romain. | Amphitheatre De Carthage | monument | Carthage |
| 4 | Quels monuments romains peut-on visiter dans le parc des villas ? | Parc des villas romaines | monument | Carthage |
| 5 | Existe-t-il un odéon romain à Carthage ? | Odeon | monument | Carthage |

---

### Punic monuments (5)

| Q# | Question | Expected retrieval target | Expected source_type | Expected destination |
|----|----------|---------------------------|----------------------|----------------------|
| 6 | Qu'est-ce que le Tophet de Carthage ? | Tophet | monument | Carthage |
| 7 | Quels sites puniques peut-on visiter à Carthage ? | Tophet *(or Quartier Magon)* | monument | Carthage |
| 8 | Où se trouve la colline de Byrsa ? | Colline de Byrsa | monument | Carthage |
| 9 | Parle-moi des ports puniques. | Ports puniques | monument | Carthage |
| 10 | Qu'est-ce que le quartier Magon ? | Quartier Magon | monument | Carthage |

**Note Q7:** Multiple valid punic targets; pass if any major punic monument (Tophet, Quartier Magon, Ports puniques, Colline de Byrsa) is in top 3.

---

### Byzantine monuments (4)

| Q# | Question | Expected retrieval target | Expected source_type | Expected destination |
|----|----------|---------------------------|----------------------|----------------------|
| 11 | Quelles basiliques byzantines visiter à Carthage ? | Basiliques byzantines | monument | Carthage |
| 12 | Où se trouve la basilique Saint Cyprien ? | Basilique Saint Cyprien | monument | Carthage |
| 13 | Parle-moi de la basilique Bir Messaouda. | Basilique Bir Messaouda | monument | Carthage |
| 14 | Y a-t-il un musée paléochrétien à Carthage ? | Parc du Musee Paleochretien Basilique de Cartagena | monument | Carthage |

---

### Circuits (5)

| Q# | Question | Expected retrieval target | Expected source_type | Expected destination |
|----|----------|---------------------------|----------------------|----------------------|
| 15 | Propose un circuit romain à Carthage. | Circuit Romain | circuit | Carthage |
| 16 | Je cherche un circuit sur l'époque punique. | Circuit Punique | circuit | Carthage |
| 17 | Quel circuit byzantin existe à Carthage ? | Circuit Byzantin | circuit | Carthage |
| 18 | J'ai peu de temps, quel circuit demi-journée faire ? | Circuit Demi-Journée | circuit | Carthage |
| 19 | Existe-t-il un circuit à La Marsa ? | Circuit La Marsa | circuit | La Marsa |

**Optional filters to test:**

```python
RetrievalFilters(source_type="circuit", language="fr")
```

---

### Accessibility (3)

| Q# | Question | Expected retrieval target | Expected source_type | Expected destination |
|----|----------|---------------------------|----------------------|----------------------|
| 20 | Quels monuments ont une accessibilité réduite ? | Maison des Lions *(or any monument with accessibility "reduite")* | monument | Carthage |
| 21 | Le théâtre est-il accessible aux visiteurs ? | Theatre | monument | Carthage |
| 22 | Quels sites puniques sont difficiles d'accès ? | Four punique *(or Nécropole punique)* | monument | Carthage |

**Note Q20/Q22:** Pass if a monument with `accessibility` containing *reduite* or *reduced* appears in top 3 and chunk text mentions accessibility.

**Valid accessibility targets from dataset:** Monastere de Bigua, Maison des Lions, Nécropole punique (Parc des villas romaines), Four punique, Kobbet el Houwa, Tombe de la Nécropole punique.

---

### Visit duration (3)

| Q# | Question | Expected retrieval target | Expected source_type | Expected destination |
|----|----------|---------------------------|----------------------|----------------------|
| 23 | Combien de temps faut-il pour visiter les Thermes d'Antonin ? | Thermes d'Antonin | monument | Carthage |
| 24 | Quels monuments se visitent en moins de 15 minutes ? | Theatre *(or other short-visit monument)* | monument | Carthage |
| 25 | Quel est le monument le plus long à visiter à Carthage ? | Colline de Byrsa *(or Parc des thermes d'Antonin)* | monument | Carthage |

**Note Q24:** Pass if top 3 includes a monument whose chunk mentions `Durée de visite` ≤ 15 min (e.g. Theatre, Maisons romaines).

**Note Q25:** Pass if top 3 includes Colline de Byrsa or Parc des thermes d'Antonin (longest durations in dataset).

---

### Historical explanations (5)

| Q# | Question | Expected retrieval target | Expected source_type | Expected destination |
|----|----------|---------------------------|----------------------|----------------------|
| 26 | Explique l'histoire du théâtre romain de Carthage. | Theatre | monument | Carthage |
| 27 | Quelle est l'importance historique du Tophet ? | Tophet | monument | Carthage |
| 28 | Raconte-moi l'histoire de la colline de Byrsa. | Colline de Byrsa | monument | Carthage |
| 29 | Que sait-on des ports puniques de Carthage ? | Ports puniques | monument | Carthage |
| 30 | Décris le parc des thermes d'Antonin et son contexte historique. | Parc des thermes d'Antonin | monument | Carthage |

**Note:** These questions target monuments with long `description_fr` text. Prefer chunks where `metadata.has_description = true`.

---

## Filter-specific test cases

Run these in addition to the 30 questions to validate metadata filters.

| Filter test | Query | Filters | Expected behavior |
|-------------|-------|---------|-------------------|
| F1 | monuments romains | `source_type=monument`, `period=romaine` | Top results are Roman monuments only |
| F2 | circuit punique | `source_type=circuit`, `period=punique` | Circuit Punique in top 1 |
| F3 | sites byzantins | `period=byzantine` | Byzantine monument or Circuit Byzantin in top 3 |
| F4 | information Carthage | `destination=Carthage`, `language=fr` | Results from Carthage corpus |
| F5 | circuit vélo | `source_type=circuit` | Circuit Carthage_cyclable or Circuit Saint Augustin_cyclable in top 3 |

---

## Category coverage summary

| Category | Questions | Q# |
|----------|:---------:|-----|
| Roman monuments | 5 | 1–5 |
| Punic monuments | 5 | 6–10 |
| Byzantine monuments | 4 | 11–14 |
| Circuits | 5 | 15–19 |
| Accessibility | 3 | 20–22 |
| Visit duration | 3 | 23–25 |
| Historical explanations | 5 | 26–30 |
| **Total** | **30** | |

---

## Expected baseline

### Sprint 2 — pure vector retrieval

After embeddings with `intfloat/multilingual-e5-small` (no reranking):

| Metric | Target | Measured (pre–Sprint 2.5) |
|--------|--------|---------------------------|
| Top-1 accuracy | ≥ 70% (21/30) | 46.7% (14/30) |
| Top-3 recall | ≥ 85% (26/30) | 80.0% (24/30) |
| Mean top-1 score | ≥ 0.75 | 0.864 |

### Sprint 2.5 — hybrid retrieval (current)

Same 30 questions, same pass criteria, hybrid reranking enabled:

| Metric | Target | Measured |
|--------|--------|----------|
| Top-1 accuracy | ≥ 70% (21/30) | **80.0% (24/30)** |
| Top-3 recall | ≥ 85% (26/30) | **86.7% (26/30)** |
| Score ≥ 0.65 | 100% | **100% (30/30)** |
| Mean top-1 score | — | 0.863 |

**Remaining failures (top-3):** Q5 (Odeon), Q11 (Basiliques byzantines), Q20 (accessibility), Q25 (longest visit).

Filter tests (F1–F5) are informational only; top-3 recall remains 100% but top-1 accuracy is lower due to strict title matching.

If results fall below baseline:

1. Review intent keywords in `query_intent.py` (circuit vs monument confusion)
2. Tune hybrid weights in `scoring.py` (defaults: 0.75 / 0.15 / 0.10)
3. Increase `vector_candidates` (default 10) if correct chunks miss the pgvector shortlist
4. Check E5 prefixes (`query:` / `passage:`) in `embeddings.py`
5. Improve chunk text quality in `document_builder.py` (weak targets: Odeon, accessibility aggregates, visit duration)
6. Consider upgrading to `BAAI/bge-m3` before Sprint 3

---

## Related files

- Retriever: `backend/app/rag/retriever.py`
- Query intent: `backend/app/rag/query_intent.py`
- Keyword utils: `backend/app/rag/text_utils.py`
- Hybrid scoring: `backend/app/rag/scoring.py`
- Evaluation script: `backend/scripts/evaluate_retrieval.py`
- Embeddings: `backend/app/rag/embeddings.py`
- Chunks: `document_chunks` table
- Latest results: `data/processed/retrieval_eval_results.json`
- Sprint 4 full agent evaluation: `docs/evaluation.md` *(to be created)*

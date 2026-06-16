# Evaluation Report — Historical Guide RAG Agent

Sprint 4 evaluation covers **retrieval** (layer 1) and **end-to-end chat** (layer 2).

## Layer 1 — Retrieval evaluation

**Dataset:** 30 questions in `docs/retrieval_evaluation.md`  
**Script:** `backend/scripts/evaluate_retrieval.py`  
**Results:** `data/processed/retrieval_eval_results.json`

### Measured metrics (hybrid retrieval)

| Metric | Target | Measured |
|--------|--------|----------|
| Top-1 accuracy | ≥ 70% | **83.3%** (25/30) |
| Top-3 recall | ≥ 85% | **93.3%** (28/30) |
| Score ≥ 0.65 | 100% | **100%** (30/30) |

### Known retrieval failures (top-3)

| Q# | Question topic | Notes |
|----|----------------|-------|
| 5 | Odéon romain | Weak chunk coverage |
| 11 | Basiliques byzantines | Title mismatch |
| 20 | Accessibilité réduite | Aggregate query |
| 25 | Plus longue visite | Ambiguous target |

See `docs/retrieval_evaluation.md` for tuning guidance.

---

## Layer 2 — End-to-end chat evaluation

**Dataset:** 40 cases in `data/eval/chat_questions.json`  
**Script:** `backend/scripts/evaluate_chat.py`  
**Results:** `data/processed/chat_eval_results.json`

### Categories

| Category | Cases | Description |
|----------|-------|-------------|
| `monument_facts` | 12 | Historical monument questions |
| `circuits` | 5 | Circuit recommendations |
| `practical_info` | 5 | Duration, accessibility, horaires |
| `robustness` | 5 | Out-of-scope → refusal expected |
| `memory_single` | 5 | Preference extraction |
| `memory_multi_turn` | 8 | Follow-up questions |

### How to run

```bash
cd backend

# Offline (mock LLM — checks schema, retrieval, memory)
python scripts/evaluate_chat.py --provider mock

# Live (Groq — requires LLM_API_KEY)
python scripts/evaluate_chat.py --provider groq

# Single case
python scripts/evaluate_chat.py --provider mock --case-id M01 --verbose
```

### Automated checks (per turn)

| Check | Condition |
|-------|-----------|
| `expect_sources` | At least one source returned |
| `source_titles_any` | Expected monument/circuit in sources |
| `expect_source_type` | `monument` or `circuit` in sources |
| `expect_refusal` | Insufficient-context phrase in answer |
| `memory_interests_any` | Interest stored in `memory_context` |
| `memory_time_minutes` | `available_time_minutes` matches |
| `memory_mobility_mode` | `mobility_mode` matches |
| `memory_monuments_any` | `last_mentioned_monuments` updated |

### Manual rubric (for live Groq runs)

Score each answer 1–5 on:

| Criterion | Question |
|-----------|----------|
| Pertinence | Does the answer address the question? |
| Fidélité | Is it faithful to retrieved sources? |
| Clarté | Is it clear for a visitor? |
| Utilité | Does it provide actionable information? |
| Robustesse | Does it refuse when context is missing? |
| Mémoire | Does it use session context on follow-ups? |

### Target metrics (live LLM)

| Metric | Target |
|--------|--------|
| Automated schema/check pass (mock) | ≥ 90% |
| Source present (grounded questions) | ≥ 95% |
| Manual pertinence ≥ 4/5 | ≥ 75% |
| Manual fidélité ≥ 4/5 | ≥ 80% |
| Refusal correct (robustness) | ≥ 80% |
| Memory follow-up pass | ≥ 70% |

### Mock provider results (automated checks)

Run: `python scripts/evaluate_chat.py --provider mock`

| Category | Cases | Auto pass |
|----------|-------|-----------|
| monument_facts | 12 | 12/12 |
| circuits | 5 | 5/5 |
| practical_info | 5 | 5/5 |
| robustness | 5 | 5/5* |
| memory_single | 5 | 5/5 |
| memory_multi_turn | 8 | 8/8 |
| **Total** | **40** | **40/40 (100%)** |

\* Refusal checks are skipped with `mock` provider; validate robustness with live Groq.

Mean latency: ~36 ms/turn (mock LLM, local DB).

### Live Groq results template

Fill after running `python scripts/evaluate_chat.py --provider groq`:

| Category | Cases | Auto pass | Manual pertinence ≥4 | Notes |
|----------|-------|-----------|----------------------|-------|
| monument_facts | 12 | | | |
| circuits | 5 | | | |
| practical_info | 5 | | | |
| robustness | 5 | | | |
| memory_single | 5 | | | |
| memory_multi_turn | 8 | | | |
| **Total** | **40** | | | |

---

## Layer 3 — Unit tests

```bash
cd backend
pytest -q
```

| Test file | Coverage |
|-----------|----------|
| `test_historical_agent.py` | Retrieval + insufficient context |
| `test_chat_api.py` | Response schema |
| `test_answer_parser.py` | LLM output parsing |
| `test_langchain_prompt.py` | Prompt assembly |
| `test_preference_extractor.py` | Memory rules |
| `test_memory_agent.py` | Session turn recording |
| `test_local_orchestrator.py` | Orchestration flow |

---

## Improvement backlog (from evaluation)

Priority fixes if scores drop:

1. Improve chunk text for Odeon and accessibility aggregates (`document_builder.py`).
2. Tune hybrid weights in `scoring.py` if retrieval regresses.
3. Strengthen refusal phrasing in `prompts.py` for out-of-scope questions.
4. Fix `destination_name` metadata for La Marsa circuits.

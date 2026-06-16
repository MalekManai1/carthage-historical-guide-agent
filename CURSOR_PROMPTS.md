# CURSOR_PROMPTS.md — Prompts pour développer le projet étape par étape

## Comment utiliser ces prompts

Utiliser Cursor en deux modes :

- **Ask mode** pour analyser et planifier sans modifier le code.
- **Agent mode** pour créer ou modifier les fichiers.

Ne jamais demander à Cursor de construire tout le projet en une seule fois.

Mauvais prompt :

```text
Build the full project.
```

Bon prompt :

```text
Create only the FastAPI skeleton and the /health endpoint.
Do not implement RAG yet.
```

---

# 1. Premier prompt — Analyse du projet avant de coder

À utiliser en **Ask mode**.

```text
Read ROADMAP.md and AGENTS.md carefully.

I am building an autonomous MVP for a historical guide RAG agent focused on Carthage, Tunisia.

The MVP must include:
- FastAPI backend
- PostgreSQL + pgvector
- Docker Compose
- Excel ingestion
- RAG pipeline
- Historical guide agent
- Memory agent
- POST /api/chat endpoint

Do not write code yet.

First, give me:
1. A short summary of the target architecture.
2. The exact initial project file tree.
3. The first 5 implementation tasks in order.
4. The files you recommend creating first.
5. Any risks or mistakes to avoid before coding.

Follow AGENTS.md strictly.
Do not propose Qdrant.
Do not propose Three.js or frontend first.
```

---

# 2. Prompt — Créer le squelette du projet

À utiliser en **Agent mode** après validation du plan.

```text
Create the initial project skeleton according to ROADMAP.md and AGENTS.md.

Create this structure:

historical-guide-rag-agent/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes_health.py
│   │   ├── models/
│   │   │   └── __init__.py
│   │   ├── schemas/
│   │   │   └── __init__.py
│   │   ├── services/
│   │   │   └── __init__.py
│   │   ├── agents/
│   │   │   └── __init__.py
│   │   ├── rag/
│   │   │   └── __init__.py
│   │   └── memory/
│   │       └── __init__.py
│   ├── scripts/
│   ├── tests/
│   └── requirements.txt
├── data/
│   ├── raw/
│   └── processed/
├── docs/
├── .env.example
├── README.md
└── .gitignore

Implement only:
- FastAPI app initialization
- /health endpoint
- settings loading from environment variables
- basic database URL configuration

Do not implement database models yet.
Do not implement RAG yet.
Do not implement agents yet.
Keep the code minimal and clean.
```

---

# 3. Prompt — Setup Docker PostgreSQL + pgvector

À utiliser en **Agent mode**.

```text
Create a docker-compose.yml for PostgreSQL with pgvector according to ROADMAP.md and AGENTS.md.

Requirements:
- Use image: pgvector/pgvector:pg16
- Service name: db
- Container name: historical_guide_db
- Database name: historical_guide
- User: postgres
- Password: postgres
- Expose port 5432
- Persist data using a named Docker volume
- Add a healthcheck
- Add clear comments

Also update .env.example with:
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/historical_guide
POSTGRES_DB=historical_guide
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

Do not create backend Dockerfile yet.
Only Dockerize PostgreSQL + pgvector for now.
```

---

# 4. Prompt — Vérifier Docker et pgvector

À utiliser en **Ask mode** si tu veux que Cursor t’explique les commandes.

```text
Explain how to start PostgreSQL + pgvector with Docker Compose for this project.

Give me:
1. The command to start the database.
2. The command to check running containers.
3. The command to open psql inside the container.
4. The SQL command to verify that pgvector is installed.
5. The SQL command to create the vector extension if needed.
6. The command to stop the database.

Do not change files.
```

Commandes attendues :

```bash
docker compose up -d
docker ps
docker exec -it historical_guide_db psql -U postgres -d historical_guide
```

SQL attendu :

```sql
CREATE EXTENSION IF NOT EXISTS vector;
SELECT * FROM pg_extension WHERE extname = 'vector';
```

---

# 5. Prompt — Setup SQLAlchemy et Alembic

À utiliser en **Agent mode**.

```text
Configure SQLAlchemy and Alembic for the backend.

Requirements:
- Use DATABASE_URL from environment variables.
- Create a database session dependency.
- Keep database code in backend/app/database.py.
- Initialize Alembic in backend/alembic.
- Configure Alembic to read metadata from SQLAlchemy models.
- Do not create business models yet unless necessary.
- Keep the setup clean and minimal.

Update requirements.txt with the necessary packages:
- fastapi
- uvicorn[standard]
- sqlalchemy
- alembic
- psycopg[binary]
- pydantic
- pydantic-settings
- python-dotenv
```

---

# 6. Prompt — Créer les modèles SQLAlchemy

À utiliser en **Agent mode**.

```text
Create SQLAlchemy models according to ROADMAP.md and AGENTS.md.

Models required:
- Destination
- Monument
- Circuit
- CircuitMonument
- DocumentChunk
- UserSession
- ChatMessage
- UserPreference

Requirements:
- Use simple relationships.
- Use clear column names.
- Use JSONB for metadata and preferences where useful.
- Use pgvector for DocumentChunk.embedding.
- Do not overcomplicate the schema.
- Add created_at and updated_at where useful.
- Keep models separated in backend/app/models/.
- Export models in backend/app/models/__init__.py.

Do not implement ingestion yet.
```

---

# 7. Prompt — Créer les migrations Alembic

À utiliser en **Agent mode**.

```text
Create the initial Alembic migration for all SQLAlchemy models.

Requirements:
- Ensure pgvector extension is created in the migration.
- Create all required tables.
- Create the vector column for document_chunks.
- Add basic indexes where useful.
- Keep the migration readable.

After creating the migration, tell me the commands to run:
1. Apply migrations.
2. Check tables in PostgreSQL.
```

---

# 8. Prompt — Ingestion Excel

À utiliser en **Agent mode**.

```text
Create backend/scripts/ingest_excel.py.

It should read these files from data/raw:
- Monuments.xlsx
- Tab_circuit.xlsx
- Tab_circuit_monument.xlsx
- Tab_destination.xlsx

Requirements:
- Use pandas.
- Normalize column names safely.
- Handle missing values safely.
- Insert destinations, monuments, circuits and circuit_monuments.
- Avoid duplicate inserts when possible.
- Print an import summary:
  - number of destinations imported
  - number of monuments imported
  - number of circuits imported
  - number of circuit-monument relations imported
- Keep the script simple.
- Do not implement RAG document generation in this script.

Use SQLAlchemy sessions from the existing database setup.
```

---

# 9. Prompt — Endpoints monuments et circuits

À utiliser en **Agent mode**.

```text
Create API endpoints for monuments and circuits.

Files:
- backend/app/api/routes_monuments.py
- backend/app/api/routes_circuits.py
- backend/app/schemas/monument.py
- backend/app/schemas/circuit.py
- backend/app/services/monument_service.py
- backend/app/services/circuit_service.py

Endpoints:
- GET /api/monuments
- GET /api/monuments/{id}
- GET /api/circuits
- GET /api/circuits/{id}
- GET /api/circuits/{id}/monuments

Requirements:
- Use Pydantic response schemas.
- Keep route files thin.
- Put query logic in service files.
- Handle not found errors.
- Do not implement RAG yet.
```

---

# 10. Prompt — Construire les documents RAG

À utiliser en **Agent mode**.

```text
Create backend/app/rag/document_builder.py and backend/scripts/build_documents.py.

Goal:
Build structured French RAG documents from monuments and circuits stored in PostgreSQL.

Each generated chunk/document should include:
- source_type: monument or circuit
- source_id
- title
- language: fr
- chunk_text
- metadata JSON

For monuments, include when available:
- name
- destination
- address
- dominant period
- secondary period
- monument function
- status
- accessibility
- relief
- visit duration
- description
- opening hours
- prices

For circuits, include when available:
- circuit name
- description
- number of steps
- distance
- duration
- ordered monuments if available

Do not generate embeddings yet.
Only build and store text chunks.
```

---

# 11. Prompt — Embeddings et pgvector

À utiliser en **Agent mode**.

```text
Create backend/app/rag/embeddings.py and backend/scripts/generate_embeddings.py.

Requirements:
- Generate embeddings for document_chunks that do not have embeddings yet.
- Start with a clean abstraction so the embedding provider can be changed later.
- Use one default embedding model configured through environment variables.
- Store embeddings in the pgvector column.
- Process chunks in batches.
- Print progress and summary.

Do not implement the LLM historical agent yet.
```

---

# 12. Prompt — Retriever sémantique

À utiliser en **Agent mode**.

```text
Create backend/app/rag/retriever.py.

The retriever should:
- receive a user query
- generate an embedding for the query
- search document_chunks using pgvector similarity
- return top_k results
- include source_type, source_id, title, score, chunk_text, and metadata
- support optional filters:
  - source_type
  - period
  - destination
  - language

Keep it simple.
Do not implement reranking yet.
```

---

# 13. Prompt — Agent historique

À utiliser en **Agent mode**.

```text
Create backend/app/agents/historical_agent.py and backend/app/rag/prompts.py.

The HistoricalAgent should:
- receive user_message and memory_context
- call the retriever
- build a grounded prompt using retrieved chunks
- call the configured LLM
- return:
  - answer
  - sources
  - suggested_actions
  - memory_updates

Rules:
- The agent must not invent facts not present in the retrieved context.
- If context is insufficient, it must say that the information is not available in the current knowledge base.
- The answer should be in French by default.
- Always return sources.

Do not implement the memory agent yet.
```

---

# 14. Prompt — Agent mémoire

À utiliser en **Agent mode**.

```text
Create backend/app/memory/memory_service.py and backend/app/agents/memory_agent.py.

The MemoryAgent should:
- create or retrieve user sessions
- store user and assistant messages
- extract useful preferences from user messages
- return a compact memory context for the historical agent

Preferences to extract:
- preferred language
- available time in minutes
- historical interests, such as romain, punique, byzantin, architecture, musée
- mobility mode, such as walking or cycling
- last mentioned monuments

Start with rule-based extraction.
Do not use an LLM for memory extraction yet.

Return memory context as a Python dict.
```

---

# 15. Prompt — LocalOrchestrator et endpoint chat

À utiliser en **Agent mode**.

```text
Create backend/app/agents/local_orchestrator.py and backend/app/api/routes_chat.py.

Implement POST /api/chat.

Request:
{
  "session_id": "session_001",
  "message": "Je veux visiter des monuments romains à Carthage",
  "language": "fr"
}

Flow:
1. Load or create the session.
2. Get memory context using MemoryAgent.
3. Call HistoricalAgent with the user message and memory context.
4. Store the user message and assistant response.
5. Update memory.
6. Return:
   - session_id
   - answer
   - sources
   - memory_context
   - suggested_actions

Keep the orchestration simple.
Do not create a complex multi-agent router.
```

---

# 16. Prompt — Tests de base

À utiliser en **Agent mode**.

```text
Create basic tests for the MVP.

Add tests for:
- /health endpoint
- monuments endpoint
- circuits endpoint
- memory preference extraction
- retriever returns top_k structure
- /api/chat response structure

Use pytest.
Keep tests simple and focused.
Do not require a real LLM call in tests; mock the LLM if needed.
```

---

# 17. Prompt — Documentation

À utiliser en **Agent mode**.

```text
Create documentation files:

- docs/architecture.md
- docs/rag_pipeline.md
- docs/integration_contract.md
- docs/evaluation.md

Also update README.md.

The documentation should explain:
- project goal
- tech stack
- architecture
- setup instructions
- Docker PostgreSQL + pgvector
- Excel ingestion
- RAG pipeline
- API endpoints
- memory agent
- historical agent
- future integration contract
- known limitations
```

---

# 18. Prompt — Interface simple seulement après backend stable

À utiliser en **Agent mode** uniquement après que `/api/chat` fonctionne.

```text
Create a simple frontend in frontend/simple-chat-ui.

Use React + Vite.

The interface should:
- send messages to POST /api/chat
- display the assistant answer
- display sources
- display suggested actions
- keep a session_id in local state

Keep the UI minimal.
Do not add Three.js.
Do not add maps yet.
```

---

# 19. Prompt de correction quand Cursor fait trop

À utiliser si Cursor commence à trop compliquer le projet.

```text
Stop and simplify.

Review AGENTS.md and ROADMAP.md.

Remove unnecessary complexity.
The MVP should only include:
- FastAPI
- PostgreSQL + pgvector
- Excel ingestion
- RAG retriever
- HistoricalAgent
- MemoryAgent
- POST /api/chat

Do not add:
- reservation
- weather
- advanced frontend
- complex orchestrator
- Qdrant
- Three.js
- advanced scraping

Refactor the current code to match the MVP scope.
```

---

# 20. Prompt de review technique

À utiliser régulièrement en **Ask mode**.

```text
Review the current codebase against ROADMAP.md and AGENTS.md.

Tell me:
1. What is implemented correctly.
2. What is missing.
3. What is overcomplicated.
4. What should be the next implementation task.
5. Any bugs or risks you notice.

Do not modify files.
```

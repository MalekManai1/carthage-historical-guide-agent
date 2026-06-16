# historical-guide-rag-agent

MVP autonome pour un agent guide historique RAG centré sur Carthage, Tunisie.

## Objectif

Développer un agent capable de répondre aux questions des utilisateurs sur les monuments, circuits et éléments culturels, en utilisant une architecture RAG basée sur PostgreSQL + pgvector.

## Modules principaux

- Agent Guide Historique
- Agent Mémoire
- Backend FastAPI
- Base PostgreSQL + pgvector
- Pipeline d’ingestion Excel
- Pipeline RAG
- Endpoint `/api/chat`

## Démarrage rapide

### 1. Lancer PostgreSQL + pgvector

```bash
docker compose up -d
```

### 2. Créer l’environnement Python

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Sur Linux/Mac :

```bash
source venv/bin/activate
```

### 3. Lancer FastAPI

```bash
uvicorn app.main:app --reload
```

### 4. Tester l’API

Swagger :

```text
http://localhost:8000/docs
```

Health check :

```text
GET /health
```

## Structure

Voir `ROADMAP.md`.

## Règles Cursor

Voir `AGENTS.md`.

## Prompts Cursor

Voir `CURSOR_PROMPTS.md`.

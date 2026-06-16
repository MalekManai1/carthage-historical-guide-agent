# ROADMAP.md — Stage d’été : Agent Guide Historique RAG + Agent Mémoire

## 1. Sujet du stage

### Titre

Développement d’un agent guide historique RAG et d’un agent mémoire pour un chatbot touristique intelligent en Tunisie.

### Objectif principal

Développer un module autonome capable de répondre aux questions des utilisateurs sur les monuments, circuits, lieux et éléments culturels en Tunisie, avec un focus prioritaire sur Carthage.

Le système doit utiliser une architecture RAG : l’agent récupère les informations pertinentes depuis une base documentaire structurée et vectorisée avant de générer une réponse.

### Périmètre personnel

Le stage se concentre sur deux composants :

1. Agent Guide Historique RAG
2. Agent Mémoire

Le projet doit fonctionner de manière autonome pendant le stage, puis être préparé pour une intégration future dans un orchestrateur principal.

---

## 2. Périmètre MVP

### Must-have

Le MVP doit inclure :

- Backend FastAPI
- PostgreSQL + pgvector
- Docker Compose pour la base de données
- Pipeline d’ingestion des fichiers Excel
- Pipeline RAG
- Génération et stockage des embeddings
- Retriever sémantique
- Agent guide historique
- Agent mémoire
- Endpoint principal `/api/chat`
- Endpoints de consultation pour monuments et circuits
- Réponses avec sources
- Mémoire de session utilisateur
- Documentation technique
- Swagger utilisable pour tester l’API

### Should-have

- Interface web simple de chat
- Filtres par époque historique
- Filtres par accessibilité
- Tests unitaires simples
- Rapport d’évaluation des réponses

### Could-have

- React + Vite
- Carte simple avec coordonnées
- Export GeoJSON depuis les fichiers QGIS
- PostGIS
- Three.js pour un modèle 3D simple
- Agent multilingue simple

### Won’t-have dans le MVP

Ne pas implémenter avant la stabilité du MVP :

- Réservation complète
- Météo
- Agent circuits avancé
- Optimisation mathématique des circuits
- Scraping avancé
- Three.js complet
- Système multilingue complexe
- Qdrant

---

## 3. Tech stack

### Backend

- Python 3.11+
- FastAPI
- Uvicorn
- Pydantic
- SQLAlchemy
- Alembic
- psycopg
- python-dotenv

### Base de données

- PostgreSQL
- pgvector
- JSONB pour les métadonnées et la mémoire utilisateur

### RAG / IA

- LangChain optionnel
- RAG simple d’abord si nécessaire
- Embeddings possibles :
  - `intfloat/multilingual-e5-small`
  - `BAAI/bge-m3`
  - embeddings API si autorisé
- LLM possible :
  - OpenAI API
  - Groq
  - Ollama
  - autre modèle disponible

### Frontend

- Swagger pour le test initial
- React + Vite plus tard si le backend est stable

### Dev local

- Docker Compose pour PostgreSQL + pgvector
- Git + GitHub
- Cursor comme IDE / coding agent

---

## 4. Architecture MVP

```text
Utilisateur
    ↓
Swagger ou interface simple
    ↓
FastAPI
    ↓
LocalOrchestrator
    ├── MemoryAgent.get_context(session_id)
    ├── HistoricalAgent.answer(message, context)
    └── MemoryAgent.update(session_id, message, answer)
    ↓
PostgreSQL + pgvector
```

### Flux principal

1. L’utilisateur envoie une question à `/api/chat`.
2. L’API transmet la demande au `LocalOrchestrator`.
3. Le `MemoryAgent` récupère le contexte de session.
4. Le `HistoricalAgent` effectue une recherche RAG dans PostgreSQL/pgvector.
5. Le LLM génère une réponse basée sur les sources récupérées.
6. Le `MemoryAgent` met à jour la mémoire.
7. L’API retourne la réponse, les sources et le contexte mémoire.

---

## 5. Structure de projet recommandée

```text
historical-guide-rag-agent/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   │
│   │   ├── api/
│   │   │   ├── routes_health.py
│   │   │   ├── routes_chat.py
│   │   │   ├── routes_monuments.py
│   │   │   ├── routes_circuits.py
│   │   │   └── routes_memory.py
│   │   │
│   │   ├── agents/
│   │   │   ├── local_orchestrator.py
│   │   │   ├── historical_agent.py
│   │   │   └── memory_agent.py
│   │   │
│   │   ├── rag/
│   │   │   ├── document_builder.py
│   │   │   ├── chunker.py
│   │   │   ├── embeddings.py
│   │   │   ├── retriever.py
│   │   │   └── prompts.py
│   │   │
│   │   ├── memory/
│   │   │   ├── memory_service.py
│   │   │   ├── preference_extractor.py
│   │   │   └── summary_service.py
│   │   │
│   │   ├── models/
│   │   │   ├── destination.py
│   │   │   ├── monument.py
│   │   │   ├── circuit.py
│   │   │   ├── document_chunk.py
│   │   │   └── memory.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── chat.py
│   │   │   ├── monument.py
│   │   │   ├── circuit.py
│   │   │   └── memory.py
│   │   │
│   │   └── services/
│   │       ├── monument_service.py
│   │       └── circuit_service.py
│   │
│   ├── scripts/
│   │   ├── ingest_excel.py
│   │   ├── build_documents.py
│   │   ├── generate_embeddings.py
│   │   └── reset_db.py
│   │
│   ├── alembic/
│   ├── tests/
│   └── requirements.txt
│
├── frontend/
│   └── simple-chat-ui/
│
├── data/
│   ├── raw/
│   │   ├── Monuments.xlsx
│   │   ├── Tab_circuit.xlsx
│   │   ├── Tab_circuit_monument.xlsx
│   │   └── Tab_destination.xlsx
│   └── processed/
│
├── docs/
│   ├── architecture.md
│   ├── rag_pipeline.md
│   ├── integration_contract.md
│   └── evaluation.md
│
├── docker-compose.yml
├── .env.example
├── AGENTS.md
├── ROADMAP.md
├── README.md
└── .gitignore
```

---

## 6. Product Backlog

### Epic 1 — Setup et environnement

| ID | User Story / Tâche | Priorité | Sprint |
|---|---|---:|---|
| B1 | Créer le repository GitHub | Must | Sprint 1 |
| B2 | Créer la structure backend FastAPI | Must | Sprint 1 |
| B3 | Ajouter endpoint `/health` | Must | Sprint 1 |
| B4 | Configurer Docker Compose pour PostgreSQL + pgvector | Must | Sprint 1 |
| B5 | Configurer `.env.example` | Must | Sprint 1 |
| B6 | Configurer SQLAlchemy | Must | Sprint 1 |
| B7 | Configurer Alembic | Must | Sprint 1 |
| B8 | Créer README initial | Should | Sprint 1 |

### Epic 2 — Données et ingestion

| ID | User Story / Tâche | Priorité | Sprint |
|---|---|---:|---|
| B9 | Analyser les fichiers Excel | Must | Sprint 1 |
| B10 | Créer modèles `Destination`, `Monument`, `Circuit`, `CircuitMonument` | Must | Sprint 1 |
| B11 | Créer migrations Alembic | Must | Sprint 1 |
| B12 | Écrire `scripts/ingest_excel.py` | Must | Sprint 1 |
| B13 | Nettoyer les valeurs manquantes et incohérentes | Must | Sprint 1 |
| B14 | Importer les monuments | Must | Sprint 1 |
| B15 | Importer les circuits | Must | Sprint 1 |
| B16 | Importer les relations circuit-monument | Must | Sprint 1 |
| B17 | Importer les destinations | Must | Sprint 1 |
| B18 | Créer endpoints monuments/circuits | Must | Sprint 1 |

### Epic 3 — Documents RAG

| ID | User Story / Tâche | Priorité | Sprint |
|---|---|---:|---|
| B19 | Créer table `document_chunks` | Must | Sprint 2 |
| B20 | Ajouter colonne `embedding vector` | Must | Sprint 2 |
| B21 | Construire documents textuels pour monuments | Must | Sprint 2 |
| B22 | Construire documents textuels pour circuits | Must | Sprint 2 |
| B23 | Ajouter métadonnées aux documents | Must | Sprint 2 |
| B24 | Implémenter chunking simple | Must | Sprint 2 |
| B25 | Écrire `scripts/build_documents.py` | Must | Sprint 2 |

### Epic 4 — Recherche vectorielle

| ID | User Story / Tâche | Priorité | Sprint |
|---|---|---:|---|
| B26 | Choisir modèle d’embedding | Must | Sprint 2 |
| B27 | Implémenter `embeddings.py` | Must | Sprint 2 |
| B28 | Générer embeddings des chunks | Must | Sprint 2 |
| B29 | Stocker embeddings dans pgvector | Must | Sprint 2 |
| B30 | Créer index vectoriel | Should | Sprint 2 |
| B31 | Implémenter `retriever.py` | Must | Sprint 2 |
| B32 | Tester top-k retrieval | Must | Sprint 2 |
| B33 | Ajouter filtres simples par type/période | Should | Sprint 2 |

### Epic 5 — Agent historique

| ID | User Story / Tâche | Priorité | Sprint |
|---|---|---:|---|
| B34 | Créer prompt système historique | Must | Sprint 3 |
| B35 | Créer `HistoricalAgent` | Must | Sprint 3 |
| B36 | Connecter agent au retriever | Must | Sprint 3 |
| B37 | Connecter agent au LLM | Must | Sprint 3 |
| B38 | Retourner réponse avec sources | Must | Sprint 3 |
| B39 | Gérer les questions sans sources suffisantes | Must | Sprint 3 |
| B40 | Ajouter actions suggérées | Should | Sprint 3 |
| B41 | Créer tests sur questions historiques | Must | Sprint 3 |

### Epic 6 — Agent mémoire

| ID | User Story / Tâche | Priorité | Sprint |
|---|---|---:|---|
| B42 | Créer table `user_sessions` | Must | Sprint 3 |
| B43 | Créer table `chat_messages` | Must | Sprint 3 |
| B44 | Créer table `user_preferences` | Must | Sprint 3 |
| B45 | Implémenter `MemoryService` | Must | Sprint 3 |
| B46 | Implémenter `MemoryAgent` | Must | Sprint 3 |
| B47 | Stocker les messages utilisateur et assistant | Must | Sprint 3 |
| B48 | Extraire préférences par règles simples | Must | Sprint 3 |
| B49 | Retourner contexte mémoire compact | Must | Sprint 3 |
| B50 | Utiliser mémoire dans `HistoricalAgent` | Must | Sprint 3 |

### Epic 7 — API Chat et orchestration locale

| ID | User Story / Tâche | Priorité | Sprint |
|---|---|---:|---|
| B51 | Créer `LocalOrchestrator` | Must | Sprint 3 |
| B52 | Créer endpoint `POST /api/chat` | Must | Sprint 3 |
| B53 | Connecter chat → mémoire → agent historique → mémoire | Must | Sprint 3 |
| B54 | Standardiser format de réponse JSON | Must | Sprint 3 |
| B55 | Ajouter gestion erreurs | Should | Sprint 3 |

### Epic 8 — Interface et évaluation

| ID | User Story / Tâche | Priorité | Sprint |
|---|---|---:|---|
| B56 | Créer interface chat simple | Should | Sprint 4 |
| B57 | Afficher réponse | Should | Sprint 4 |
| B58 | Afficher sources | Should | Sprint 4 |
| B59 | Afficher contexte mémoire | Could | Sprint 4 |
| B60 | Créer 30 à 50 questions de test | Must | Sprint 4 |
| B61 | Évaluer pertinence des réponses | Must | Sprint 4 |
| B62 | Évaluer fidélité aux sources | Must | Sprint 4 |
| B63 | Corriger prompts et retrieval | Must | Sprint 4 |

### Epic 9 — Documentation et intégration future

| ID | User Story / Tâche | Priorité | Sprint |
|---|---|---:|---|
| B64 | Rédiger README complet | Must | Sprint 4 |
| B65 | Rédiger `docs/architecture.md` | Must | Sprint 4 |
| B66 | Rédiger `docs/rag_pipeline.md` | Must | Sprint 4 |
| B67 | Rédiger `docs/evaluation.md` | Must | Sprint 4 |
| B68 | Rédiger `docs/integration_contract.md` | Must | Sprint 4 |
| B69 | Préparer démo finale | Must | Sprint 4 |

---

## 7. Organisation Scrum

Le stage dure 8 semaines. Le travail est organisé en 4 sprints de 2 semaines.

---

## Sprint 1 — Setup, base de données et ingestion

### Durée

Semaines 1 et 2.

### Sprint Goal

Créer les fondations du projet : backend FastAPI, PostgreSQL/pgvector, modèles de données, ingestion des datasets Excel.

### Sprint Backlog

B1 à B18.

### Tâches techniques

1. Créer repo GitHub.
2. Initialiser backend FastAPI.
3. Ajouter endpoint `/health`.
4. Configurer Docker Compose.
5. Lancer PostgreSQL + pgvector.
6. Créer `.env.example`.
7. Configurer SQLAlchemy.
8. Configurer Alembic.
9. Créer modèles SQLAlchemy.
10. Créer migrations.
11. Lire les fichiers Excel avec pandas.
12. Nettoyer les données.
13. Importer monuments, circuits, destinations.
14. Importer relations circuit-monument.
15. Créer endpoints de lecture.

### Definition of Done

- `docker compose up -d` fonctionne.
- FastAPI démarre.
- `/health` fonctionne.
- Les données Excel sont importées.
- Les monuments et circuits sont accessibles via API.
- Le code est commité sur GitHub.

### Livrables

- Backend minimal.
- Base PostgreSQL remplie.
- Endpoints de consultation.
- README initial.

---

## Sprint 2 — Pipeline RAG et recherche vectorielle

### Durée

Semaines 3 et 4.

### Sprint Goal

Transformer les données en documents RAG, générer les embeddings et permettre la recherche sémantique.

### Sprint Backlog

B19 à B33.

### Tâches techniques

1. Créer table `document_chunks`.
2. Construire documents textuels à partir des monuments.
3. Construire documents textuels à partir des circuits.
4. Ajouter métadonnées.
5. Implémenter chunking.
6. Choisir modèle d’embedding.
7. Générer embeddings.
8. Stocker embeddings dans pgvector.
9. Créer retriever sémantique.
10. Tester top-k retrieval.
11. Ajouter filtres simples.

### Definition of Done

- Chaque monument important a au moins un chunk.
- Chaque circuit a au moins un chunk.
- Les embeddings sont stockés.
- Une requête utilisateur retourne des chunks pertinents.
- Les résultats contiennent score, source, titre et métadonnées.

### Livrables

- Pipeline RAG.
- Retriever sémantique.
- Scripts `build_documents.py` et `generate_embeddings.py`.

---

## Sprint 3 — Agent historique, agent mémoire et endpoint chat

### Durée

Semaines 5 et 6.

### Sprint Goal

Développer les deux agents principaux et connecter le flux complet via `/api/chat`.

### Sprint Backlog

B34 à B55.

### Tâches techniques

1. Créer prompt système de l’agent historique.
2. Créer `HistoricalAgent`.
3. Connecter `HistoricalAgent` au retriever.
4. Connecter `HistoricalAgent` au LLM.
5. Retourner réponse avec sources.
6. Créer tables mémoire.
7. Créer `MemoryService`.
8. Créer `MemoryAgent`.
9. Stocker messages utilisateur et assistant.
10. Extraire préférences simples.
11. Créer contexte mémoire compact.
12. Créer `LocalOrchestrator`.
13. Créer endpoint `POST /api/chat`.
14. Tester conversations multi-tours.

### Definition of Done

- `/api/chat` fonctionne.
- L’agent historique répond avec sources.
- L’agent mémoire stocke les messages.
- Les préférences utilisateur sont extraites.
- Les questions de suivi utilisent le contexte mémoire.
- L’agent refuse de répondre quand le contexte est insuffisant.

### Livrables

- Agent historique.
- Agent mémoire.
- Orchestration locale.
- Endpoint chat.
- Tests de base.

---

## Sprint 4 — Interface, évaluation, documentation et intégration future

### Durée

Semaines 7 et 8.

### Sprint Goal

Créer une démo propre, évaluer le système et documenter l’intégration future.

### Sprint Backlog

B56 à B69.

### Tâches techniques

1. Créer interface chat simple ou utiliser Swagger si manque de temps.
2. Afficher réponse et sources.
3. Créer un jeu de 30 à 50 questions.
4. Évaluer chaque réponse.
5. Corriger prompts.
6. Corriger retrieval.
7. Rédiger README final.
8. Rédiger architecture.
9. Rédiger pipeline RAG.
10. Rédiger contrat d’intégration.
11. Préparer démonstration finale.

### Definition of Done

- Démo utilisable.
- Questions de test documentées.
- Scores qualitatifs documentés.
- README complet.
- Contrat d’intégration disponible.
- Projet prêt à être présenté.

### Livrables

- MVP autonome.
- Documentation complète.
- Rapport d’évaluation.
- Contrat d’intégration.
- Démo finale.

---

## 8. Endpoint principal

### Endpoint

```http
POST /api/chat
```

### Request

```json
{
  "session_id": "session_001",
  "message": "Je veux visiter des monuments romains à Carthage",
  "language": "fr"
}
```

### Response

```json
{
  "session_id": "session_001",
  "answer": "À Carthage, plusieurs monuments permettent de découvrir l’époque romaine...",
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
    "Proposer un circuit romain",
    "Voir les monuments proches"
  ]
}
```

---

## 9. Prompt système de l’agent historique

```text
Tu es un guide historique spécialisé dans Carthage et le patrimoine tunisien.

Tu dois répondre uniquement à partir du contexte fourni par le système RAG.
Si une information n’est pas présente dans les sources, tu dois dire clairement que tu ne peux pas la confirmer.
Tu ne dois pas inventer de dates, horaires, tarifs ou faits historiques.

Ta réponse doit être :
- claire ;
- utile pour un visiteur ;
- contextualisée ;
- fidèle aux sources ;
- en français par défaut, sauf si une autre langue est demandée.

Quand c’est utile, tu peux mentionner :
- le monument ;
- l’époque historique ;
- la fonction du monument ;
- la durée de visite ;
- l’accessibilité ;
- les horaires ;
- les tarifs ;
- les circuits liés.

Tu dois éviter les réponses trop longues sauf si l’utilisateur demande une explication détaillée.
```

---

## 10. Critères d’évaluation

Créer `docs/evaluation.md` avec un tableau :

| Question | Type | Réponse correcte ? | Sources pertinentes ? | Fidélité | Clarté | Notes |
|---|---|---:|---:|---:|---:|---|

Critères :

- Pertinence : la réponse répond-elle à la question ?
- Fidélité : la réponse respecte-t-elle les sources ?
- Clarté : la réponse est-elle claire pour un visiteur ?
- Utilité : la réponse donne-t-elle une information actionnable ?
- Robustesse : l’agent sait-il dire qu’il ne sait pas ?
- Mémoire : la réponse tient-elle compte du contexte utilisateur ?

---

## 11. Exemples de questions de test

```text
Explique-moi les Thermes d’Antonin.
Quels monuments romains peut-on visiter à Carthage ?
Quels sites sont liés à l’époque punique ?
Je suis intéressé par l’architecture romaine.
J’ai 1h30, que peux-tu me conseiller ?
Quels monuments sont ouverts ?
Quels monuments sont accessibles ?
Combien coûte l’entrée pour un étudiant ?
Quelle est l’importance historique de Byrsa ?
Donne-moi une visite courte de Carthage.
```

---

## 12. Ordre de priorité réel

Cursor doit toujours respecter cet ordre :

1. Backend minimal
2. PostgreSQL + pgvector
3. Ingestion datasets
4. Documents RAG
5. Embeddings
6. Retriever
7. Agent historique
8. Agent mémoire
9. Endpoint chat
10. Tests
11. Interface simple
12. Documentation
13. Intégration future

Ne pas commencer par le frontend ou Three.js.

---

## 13. Résultat final attendu

À la fin du stage, le projet doit permettre :

1. De lancer PostgreSQL + pgvector avec Docker.
2. D’importer les datasets Excel.
3. De générer des documents RAG.
4. De stocker les embeddings.
5. De poser une question historique à `/api/chat`.
6. D’obtenir une réponse basée sur les sources.
7. De conserver le contexte utilisateur.
8. De tester plusieurs scénarios conversationnels.
9. De présenter une documentation claire.
10. D’intégrer le module plus tard dans un orchestrateur principal.

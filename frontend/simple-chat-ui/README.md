# Guide Historique — Chat UI

Interface React/Vite type ChatGPT avec conversations séparées.

## Prérequis

**Option A — Portable Node (recommandé, sans installation système)**

Depuis la racine du projet :

```powershell
.\.tools\install-node.ps1
```

**Option B — Node.js système**

Installez Node.js LTS : https://nodejs.org/ puis vérifiez `node -v` et `npm -v`.

## Lancer l'interface

Terminal 1 — API :

```powershell
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

Terminal 2 — UI (avec Node portable) :

```powershell
cd frontend\simple-chat-ui
.\run-dev.ps1
```

Ou avec Node système :

```powershell
cd frontend\simple-chat-ui
npm install
npm run dev
```

Ouvrez http://localhost:5173

## Fonctionnalités

- **Nouvelle conversation** — crée une session API distincte (`chat_…`)
- **Sidebar** — liste des chats, titre = premier message
- **Persistance locale** — historique stocké dans `localStorage`
- **Sources & mémoire** — panneau repliable sous chaque réponse
- **Proxy Vite** — `/api` → `localhost:8000` (pas de config CORS en dev)

## Configuration

Copiez `.env.example` vers `.env` si besoin. En dev, laissez `VITE_API_URL` vide.

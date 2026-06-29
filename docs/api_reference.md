# API Reference

## Chat (Historical Guide)

### `POST /api/chat`

Unchanged. See [integration_contract.md](integration_contract.md).

---

## Circuit recommendation

### `POST /api/circuits/recommend`

Generates a personalized visit circuit using the algorithmic `CircuitAgent` (GA + Dijkstra). **No LLM.**

**Tag:** `circuits`  
**Content-Type:** `application/json`

#### Request body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | string | yes | Client session identifier |
| `age` | int | no | Visitor age |
| `type_tarif` | enum | yes | `resident`, `etudiant`, `etranger`, `enseignant`, `retraite`, `enfant` |
| `budget_max` | float | yes | Maximum budget (TND) |
| `transport` | enum | yes | `walking`, `bike`, `car`, `public_transport` |
| `mobilite` | enum | no | `normale`, `reduite`, `limitee` (default `normale`) |
| `duration_minutes` | int | no* | Available visit window in minutes |
| `start_time` | string | no* | `HH:MM` |
| `end_time` | string | no* | `HH:MM` |
| `zone` | string | no | Default `Carthage` |
| `preferences.epoques` | string[] | no | Preferred historical periods |
| `preferences.fonctions` | string[] | no | Preferred monument functions |
| `preferences.must_visit` | string[] | no | Required monument names |
| `preferences.avoid` | string[] | no | Excluded monument names |
| `max_stops` | int | no | Default 12 |

\* Provide `duration_minutes` **or** both `start_time` and `end_time`.

#### Example request

```json
{
  "session_id": "session_001",
  "age": 22,
  "type_tarif": "etudiant",
  "budget_max": 30,
  "transport": "walking",
  "mobilite": "normale",
  "duration_minutes": 120,
  "start_time": "09:00",
  "end_time": "11:00",
  "zone": "Carthage",
  "preferences": {
    "epoques": ["Romaine", "Punique"],
    "fonctions": ["musee", "religieux", "culturel"],
    "must_visit": ["Thermes d'Antonin"],
    "avoid": []
  }
}
```

#### Example response (200)

```json
{
  "session_id": "session_001",
  "circuit": {
    "title": "Circuit personnalisé à Carthage",
    "summary": "2 monuments, 82 min au total (7 min de trajet), budget 4/30 TND.",
    "monuments": [
      {
        "order": 1,
        "monument_id": 3.9,
        "name": "Thermes d'Antonin",
        "latitude": 36.8545707,
        "longitude": 10.3345294,
        "visit_duration_min": 60,
        "price": 2,
        "arrival_time": "09:00",
        "departure_time": "10:00",
        "reason": "Correspond à votre intérêt pour l'époque historique demandée."
      }
    ],
    "total_visit_duration_min": 75,
    "total_travel_duration_min": 6.9,
    "total_duration_min": 81.9,
    "total_distance_km": 0.59,
    "total_price": 4,
    "score": 0.8
  },
  "route": {
    "transport": "walking",
    "polyline": [[36.8545707, 10.3345294], [36.8562934, 10.3283601]],
    "segments": [
      {
        "from": "Thermes d'Antonin",
        "to": "Theatre",
        "distance_km": 0.59,
        "duration_min": 6.9,
        "path": [[36.8545707, 10.3345294], [36.8562934, 10.3283601]]
      }
    ]
  },
  "constraints": {
    "budget_ok": true,
    "duration_ok": true,
    "mobility_ok": true
  },
  "explanation": ["Le circuit respecte le budget maximal."],
  "alternatives": [],
  "warnings": [],
  "feasible": true
}
```

#### Error responses

| Status | When |
|--------|------|
| `400` | Invalid request body |
| `422` | Unknown required monument, no feasible circuit |
| `503` | Database unavailable |
| `500` | Unexpected server error |

#### Map visualization (frontend)

- Coordinates are **`[latitude, longitude]`** in `route.polyline` and `route.segments[].path`.
- Leaflet `Polyline` and `Marker` use the same order.
- Fit map bounds to the polyline after each successful recommendation.

#### curl

```bash
curl -X POST http://localhost:8000/api/circuits/recommend \
  -H "Content-Type: application/json" \
  -d '{"session_id":"session_001","type_tarif":"etudiant","budget_max":30,"transport":"walking","mobilite":"normale","duration_minutes":120,"zone":"Carthage","preferences":{"epoques":["Romaine"],"fonctions":["musee"],"must_visit":["Thermes d'\''Antonin"],"avoid":[]}}'
```

---

## Health

### `GET /health`

Returns API health status.

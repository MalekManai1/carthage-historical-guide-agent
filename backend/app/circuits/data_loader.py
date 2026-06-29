from __future__ import annotations

import math
import re
import unicodedata
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.monument import Monument
from app.models.monument_distance import MonumentDistance
from app.models.reference_circuit import ReferenceCircuit

TARIFF_COLUMN_MAP: dict[str, str] = {
    "resident": "price_resident",
    "etudiant": "price_student",
    "etranger": "price_foreign",
    "enseignant": "price_teacher",
    "retraite": "price_senior",
    "enfant": "price_child",
}


def normalize_name(value: str | None) -> str:
    if not value:
        return ""
    text = unicodedata.normalize("NFKD", str(value).strip().lower())
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[^\w\s']", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def get_monument_price(monument: Monument, tariff_type: str) -> float:
    column = TARIFF_COLUMN_MAP.get(tariff_type, "price_resident")
    value = getattr(monument, column, None)
    if value is None:
        return 0.0
    return float(value)


@dataclass(frozen=True)
class MonumentNode:
    id: Decimal
    name: str
    latitude: float
    longitude: float
    visit_duration_min: float
    popularity: float
    price: float
    dominant_period: str | None
    secondary_period: str | None
    third_period: str | None
    function: str | None
    accessibility: str | None
    relief: str | None

    @classmethod
    def from_orm(cls, monument: Monument, *, price: float) -> MonumentNode:
        return cls(
            id=monument.id,
            name=monument.name_fr,
            latitude=float(monument.latitude or 0),
            longitude=float(monument.longitude or 0),
            visit_duration_min=float(monument.visit_duration_minutes or 15),
            popularity=float(monument.popularity or 3),
            price=price,
            dominant_period=monument.dominant_period,
            secondary_period=monument.secondary_period,
            third_period=monument.third_period,
            function=monument.function,
            accessibility=monument.accessibility,
            relief=monument.relief,
        )


@dataclass
class GraphEdge:
    to_id: Decimal
    distance_km: float
    duration_walk_min: float
    duration_bike_min: float
    duration_car_min: float


class CircuitDataLoader:
    def __init__(self, db: Session) -> None:
        self._db = db

    def load_monuments(self, tariff_type: str) -> dict[Decimal, MonumentNode]:
        monuments = self._db.scalars(select(Monument)).all()
        nodes: dict[Decimal, MonumentNode] = {}
        for monument in monuments:
            if monument.latitude is None or monument.longitude is None:
                continue
            price = get_monument_price(monument, tariff_type)
            nodes[monument.id] = MonumentNode.from_orm(monument, price=price)
        return nodes

    def load_graph(self) -> dict[Decimal, dict[Decimal, GraphEdge]]:
        graph: dict[Decimal, dict[Decimal, GraphEdge]] = {}
        edges = self._db.scalars(select(MonumentDistance)).all()
        for edge in edges:
            graph.setdefault(edge.from_monument_id, {})[edge.to_monument_id] = GraphEdge(
                to_id=edge.to_monument_id,
                distance_km=float(edge.distance_km or 0),
                duration_walk_min=float(edge.duration_walk_min or 0),
                duration_bike_min=float(edge.duration_bike_min or 0),
                duration_car_min=float(edge.duration_car_min or 0),
            )
        return graph

    def load_reference_circuits(self) -> list[dict[str, Any]]:
        refs = self._db.scalars(select(ReferenceCircuit)).all()
        return [
            {
                "external_id": ref.external_id,
                "monument_ids": ref.monument_ids or [],
                "monument_names": ref.monument_names,
                "score": float(ref.score or 0),
            }
            for ref in refs
        ]

    def resolve_monument_ids_by_names(
        self,
        names: list[str],
        nodes: dict[Decimal, MonumentNode],
    ) -> tuple[list[Decimal], list[str]]:
        name_index = {normalize_name(node.name): node.id for node in nodes.values()}
        resolved: list[Decimal] = []
        unknown: list[str] = []
        for raw_name in names:
            normalized = normalize_name(raw_name)
            monument_id = name_index.get(normalized)
            if monument_id is None:
                for key, node_id in name_index.items():
                    if normalized in key or key in normalized:
                        monument_id = node_id
                        break
            if monument_id is None:
                unknown.append(raw_name)
            else:
                resolved.append(monument_id)
        return resolved, unknown


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * radius_km * math.asin(math.sqrt(a))

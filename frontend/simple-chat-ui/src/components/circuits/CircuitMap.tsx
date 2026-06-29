import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { getOsrmRoute } from "../../services/osrmApi";
import type { CircuitRecommendResponse } from "../../types/circuit";

interface CircuitMapProps {
  result: CircuitRecommendResponse | null;
}

type RouteTraceStatus = "idle" | "loading" | "osrm" | "fallback";

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) {
      return;
    }
    if (positions.length === 1) {
      map.setView(positions[0], 15);
      return;
    }
    map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
  }, [map, positions]);

  return null;
}

function numberedIcon(order: number) {
  return L.divIcon({
    className: "circuit-leaflet-marker",
    html: `<div class="circuit-marker-pin">${order}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function routeStatusLabel(status: RouteTraceStatus): string {
  switch (status) {
    case "loading":
      return "Calcul du tracé…";
    case "osrm":
      return "Tracé routier via OSRM";
    case "fallback":
      return "Tracé indicatif";
    default:
      return "";
  }
}

export default function CircuitMap({ result }: CircuitMapProps) {
  const monuments = result?.circuit.monuments ?? [];
  const fallbackPolyline = useMemo(
    () =>
      (result?.route.polyline ?? []).map(
        ([lat, lng]) => [lat, lng] as [number, number],
      ),
    [result],
  );

  const [routePositions, setRoutePositions] = useState<[number, number][]>([]);
  const [routeStatus, setRouteStatus] = useState<RouteTraceStatus>("idle");

  const routeKey = useMemo(() => {
    if (!result) {
      return "";
    }
    return [
      result.session_id,
      result.route.transport,
      ...result.circuit.monuments.map(
        (monument) => `${monument.name}:${monument.latitude}:${monument.longitude}`,
      ),
    ].join("|");
  }, [result]);

  useEffect(() => {
    if (!result || monuments.length === 0) {
      setRoutePositions([]);
      setRouteStatus("idle");
      return;
    }

    if (monuments.length === 1) {
      setRoutePositions([[monuments[0].latitude, monuments[0].longitude]]);
      setRouteStatus("fallback");
      return;
    }

    const coordinates = monuments.map((monument) => ({
      latitude: monument.latitude,
      longitude: monument.longitude,
    }));

    let cancelled = false;
    setRouteStatus("loading");

    getOsrmRoute(coordinates, result.route.transport)
      .then((positions) => {
        if (cancelled) {
          return;
        }
        setRoutePositions(positions);
        setRouteStatus("osrm");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setRoutePositions(
          fallbackPolyline.length > 0
            ? fallbackPolyline
            : coordinates.map((point) => [point.latitude, point.longitude]),
        );
        setRouteStatus("fallback");
      });

    return () => {
      cancelled = true;
    };
  }, [routeKey, fallbackPolyline]);

  const markerPositions = monuments.map(
    (monument) => [monument.latitude, monument.longitude] as [number, number],
  );
  const boundsPositions =
    routePositions.length > 0 ? routePositions : markerPositions;

  if (!result || monuments.length === 0) {
    return (
      <section className="circuit-map card-panel circuit-map-empty">
        <h2>Carte du circuit</h2>
        <p>
          Renseignez vos préférences pour générer un circuit personnalisé à
          Carthage.
        </p>
      </section>
    );
  }

  const center = markerPositions[0] ?? [36.857, 10.33];

  return (
    <section className="circuit-map card-panel">
      <div className="circuit-map-header">
        <h2>Carte du circuit</h2>
        {routeStatus !== "idle" && (
          <span
            className={`circuit-map-note${
              routeStatus === "osrm" ? " circuit-map-note-osrm" : ""
            }`}
          >
            {routeStatusLabel(routeStatus)}
          </span>
        )}
      </div>
      <div className="circuit-map-frame">
        <MapContainer
          center={center}
          zoom={15}
          scrollWheelZoom
          className="circuit-leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds positions={boundsPositions} />
          {monuments.map((monument) => (
            <Marker
              key={`${monument.order}-${monument.name}`}
              position={[monument.latitude, monument.longitude]}
              icon={numberedIcon(monument.order)}
            >
              <Popup>
                <strong>{monument.name}</strong>
                <br />
                Visite : {Math.round(monument.visit_duration_min)} min
                <br />
                Prix : {monument.price.toFixed(0)} TND
                {monument.arrival_time && monument.departure_time && (
                  <>
                    <br />
                    {monument.arrival_time} → {monument.departure_time}
                  </>
                )}
              </Popup>
            </Marker>
          ))}
          {routePositions.length >= 2 && (
            <Polyline
              positions={routePositions}
              pathOptions={{ color: "#fa7921", weight: 5, opacity: 0.9 }}
            />
          )}
        </MapContainer>
      </div>
    </section>
  );
}

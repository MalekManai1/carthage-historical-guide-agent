import type { CircuitConstraintsStatus, CircuitSummary } from "../../types/circuit";

interface CircuitSummaryCardsProps {
  circuit: CircuitSummary;
  constraints: CircuitConstraintsStatus;
}

function formatMinutes(value: number): string {
  return `${Math.round(value)} min`;
}

export default function CircuitSummaryCards({
  circuit,
  constraints,
}: CircuitSummaryCardsProps) {
  return (
    <div className="circuit-summary-cards">
      <article className="circuit-stat-card">
        <span className="circuit-stat-label">Durée totale</span>
        <strong>{formatMinutes(circuit.total_duration_min)}</strong>
        <small>
          Visite {formatMinutes(circuit.total_visit_duration_min)} · Trajet{" "}
          {formatMinutes(circuit.total_travel_duration_min)}
        </small>
      </article>
      <article className="circuit-stat-card">
        <span className="circuit-stat-label">Distance</span>
        <strong>{circuit.total_distance_km.toFixed(1)} km</strong>
      </article>
      <article className="circuit-stat-card">
        <span className="circuit-stat-label">Budget</span>
        <strong>{circuit.total_price.toFixed(0)} TND</strong>
      </article>
      <article className="circuit-stat-card">
        <span className="circuit-stat-label">Score</span>
        <strong>{circuit.score.toFixed(2)}</strong>
      </article>
      <article
        className={`circuit-stat-card constraint${constraints.budget_ok ? " ok" : " warn"}`}
      >
        <span className="circuit-stat-label">Budget</span>
        <strong>{constraints.budget_ok ? "OK" : "Dépassé"}</strong>
      </article>
      <article
        className={`circuit-stat-card constraint${constraints.duration_ok ? " ok" : " warn"}`}
      >
        <span className="circuit-stat-label">Durée</span>
        <strong>{constraints.duration_ok ? "OK" : "Dépassée"}</strong>
      </article>
      <article
        className={`circuit-stat-card constraint${constraints.mobility_ok ? " ok" : " warn"}`}
      >
        <span className="circuit-stat-label">Mobilité</span>
        <strong>{constraints.mobility_ok ? "OK" : "À vérifier"}</strong>
      </article>
    </div>
  );
}

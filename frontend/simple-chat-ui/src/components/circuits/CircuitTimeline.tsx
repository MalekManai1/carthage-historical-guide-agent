import type { RecommendedMonument } from "../../types/circuit";

interface CircuitTimelineProps {
  monuments: RecommendedMonument[];
}

export default function CircuitTimeline({ monuments }: CircuitTimelineProps) {
  if (monuments.length === 0) {
    return null;
  }

  return (
    <section className="circuit-timeline card-panel">
      <h2>Itinéraire détaillé</h2>
      <ol className="circuit-timeline-list">
        {monuments.map((monument) => (
          <li key={`${monument.order}-${monument.name}`} className="circuit-timeline-item">
            <div className="circuit-timeline-marker">{monument.order}</div>
            <div className="circuit-timeline-content">
              <h3>{monument.name}</h3>
              <div className="circuit-timeline-meta">
                {monument.arrival_time && monument.departure_time && (
                  <span>
                    {monument.arrival_time} → {monument.departure_time}
                  </span>
                )}
                <span>{Math.round(monument.visit_duration_min)} min de visite</span>
                <span>{monument.price.toFixed(0)} TND</span>
              </div>
              <p className="circuit-timeline-reason">{monument.reason}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

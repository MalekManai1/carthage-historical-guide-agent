import type { CircuitRecommendResponse } from "../../types/circuit";
import CircuitSummaryCards from "./CircuitSummaryCards";

interface CircuitResultPanelProps {
  result: CircuitRecommendResponse;
}

export default function CircuitResultPanel({ result }: CircuitResultPanelProps) {
  const { circuit, constraints, explanation, warnings, feasible } = result;

  return (
    <section className="circuit-result card-panel" aria-live="polite">
      <div className="circuit-result-header">
        <div>
          <h2>{circuit.title}</h2>
          <p className="circuit-result-summary">{circuit.summary}</p>
        </div>
        <span className={`circuit-feasible-badge${feasible ? "" : " warn"}`}>
          {feasible ? "Circuit réalisable" : "Contraintes partielles"}
        </span>
      </div>

      <CircuitSummaryCards circuit={circuit} constraints={constraints} />

      {warnings.length > 0 && (
        <div className="circuit-warnings">
          <h3>Avertissements</h3>
          <ul>
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {explanation.length > 0 && (
        <div className="circuit-explanation">
          <h3>Explication</h3>
          <ul>
            {explanation.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

import { useMemo, useState } from "react";
import { DEFAULT_CIRCUIT_FORM } from "../../content/circuitContent";
import { buildCircuitPayload, recommendCircuit } from "../../services/circuitApi";
import type { CircuitFormState, CircuitRecommendResponse } from "../../types/circuit";
import CircuitMap from "./CircuitMap";
import CircuitRecommendationForm from "./CircuitRecommendationForm";
import CircuitResultPanel from "./CircuitResultPanel";
import CircuitTimeline from "./CircuitTimeline";

function createSessionId(): string {
  return `circuit_${Date.now()}`;
}

export default function CircuitPlannerPage() {
  const [form, setForm] = useState<CircuitFormState>({ ...DEFAULT_CIRCUIT_FORM });
  const [result, setResult] = useState<CircuitRecommendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useMemo(() => createSessionId(), []);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const payload = buildCircuitPayload(form, sessionId);
      const response = await recommendCircuit(payload);
      setResult(response);
    } catch (submitError) {
      setResult(null);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible de générer un circuit avec ces contraintes. Essayez d'élargir la durée ou le budget.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-section circuit-planner-page">
      <header className="page-header">
        <h1>Circuit personnalisé</h1>
        <p>
          Générez un itinéraire optimisé à Carthage selon votre budget, votre
          mobilité et vos préférences historiques.
        </p>
      </header>

      <div className="circuit-planner-layout">
        <aside className="circuit-planner-form-column">
          <CircuitRecommendationForm
            form={form}
            loading={loading}
            onChange={setForm}
            onSubmit={handleSubmit}
          />
        </aside>

        <div className="circuit-planner-main-column">
          {loading && (
            <div className="circuit-status card-panel" role="status">
              Optimisation du circuit…
            </div>
          )}

          {!loading && error && (
            <div className="circuit-status card-panel circuit-status-error" role="alert">
              {error}
            </div>
          )}

          {!loading && !error && !result && (
            <div className="circuit-status card-panel circuit-status-empty">
              Renseignez vos préférences pour générer un circuit personnalisé à
              Carthage.
            </div>
          )}

          {result && !loading && <CircuitResultPanel result={result} />}
          <CircuitMap result={result} />
          {result && !loading && (
            <CircuitTimeline monuments={result.circuit.monuments} />
          )}
        </div>
      </div>
    </section>
  );
}

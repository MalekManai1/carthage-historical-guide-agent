import { useState } from "react";
import {
  DEFAULT_CIRCUIT_FORM,
  EXTRA_MONUMENT_OPTIONS,
  FEATURED_MONUMENT_OPTIONS,
  FUNCTION_OPTIONS,
  PERIOD_OPTIONS,
} from "../../content/circuitContent";
import type { CircuitFormState } from "../../types/circuit";

interface CircuitRecommendationFormProps {
  form: CircuitFormState;
  loading: boolean;
  onChange: (form: CircuitFormState) => void;
  onSubmit: () => void;
}

function toggleChip(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function ChipRow({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="circuit-chips">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`circuit-chip${selected.includes(option) ? " active" : ""}`}
          onClick={() => onToggle(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default function CircuitRecommendationForm({
  form,
  loading,
  onChange,
  onSubmit,
}: CircuitRecommendationFormProps) {
  const [showAllMonuments, setShowAllMonuments] = useState(false);

  function update<K extends keyof CircuitFormState>(key: K, value: CircuitFormState[K]) {
    onChange({ ...form, [key]: value });
  }

  const visibleMonuments = showAllMonuments
    ? [...FEATURED_MONUMENT_OPTIONS, ...EXTRA_MONUMENT_OPTIONS]
    : [...FEATURED_MONUMENT_OPTIONS];

  return (
    <form
      className="circuit-form card-panel"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <header className="circuit-form-header">
        <h2>Votre circuit sur mesure</h2>
        <p>Quelques informations suffisent pour générer un parcours adapté à Carthage.</p>
      </header>

      <section className="circuit-form-section">
        <h3 className="circuit-section-title">Profil de visite</h3>
        <div className="circuit-form-grid circuit-form-grid-compact">
          <label className="circuit-field">
            <span>Type de tarif</span>
            <select
              value={form.type_tarif}
              onChange={(e) =>
                update("type_tarif", e.target.value as CircuitFormState["type_tarif"])
              }
            >
              <option value="etudiant">Étudiant</option>
              <option value="resident">Résident</option>
              <option value="etranger">Étranger</option>
              <option value="enseignant">Enseignant</option>
              <option value="retraite">Retraité</option>
              <option value="enfant">Enfant</option>
            </select>
          </label>

          <label className="circuit-field">
            <span>Budget max (TND)</span>
            <input
              type="number"
              min={1}
              step={1}
              required
              value={form.budget_max}
              onChange={(e) => update("budget_max", e.target.value)}
            />
          </label>

          <label className="circuit-field">
            <span>Mobilité</span>
            <select
              value={form.mobilite}
              onChange={(e) =>
                update("mobilite", e.target.value as CircuitFormState["mobilite"])
              }
            >
              <option value="normale">Normale</option>
              <option value="reduite">Réduite</option>
              <option value="limitee">Limitée</option>
            </select>
          </label>

          <label className="circuit-field">
            <span>Transport</span>
            <select
              value={form.transport}
              onChange={(e) =>
                update("transport", e.target.value as CircuitFormState["transport"])
              }
            >
              <option value="walking">À pied</option>
              <option value="bike">Vélo</option>
              <option value="car">Voiture</option>
              <option value="public_transport">Transport public</option>
            </select>
          </label>
        </div>
      </section>

      <section className="circuit-form-section">
        <h3 className="circuit-section-title">Temps disponible</h3>
        <div className="circuit-form-grid circuit-form-grid-compact">
          <label className="circuit-field">
            <span>Durée (minutes)</span>
            <input
              type="number"
              min={15}
              max={720}
              value={form.duration_minutes}
              onChange={(e) => update("duration_minutes", e.target.value)}
            />
          </label>

          <label className="circuit-field">
            <span>Heure de début</span>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => update("start_time", e.target.value)}
            />
          </label>

          <label className="circuit-field circuit-field-wide">
            <span>Heure de fin</span>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => update("end_time", e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="circuit-form-section">
        <h3 className="circuit-section-title">Préférences</h3>
        <div className="circuit-chip-block">
          <span className="circuit-chip-label">Époques</span>
          <ChipRow
            options={PERIOD_OPTIONS}
            selected={form.epoques}
            onToggle={(value) => update("epoques", toggleChip(form.epoques, value))}
          />
        </div>
        <div className="circuit-chip-block">
          <span className="circuit-chip-label">Types de sites</span>
          <ChipRow
            options={FUNCTION_OPTIONS}
            selected={form.fonctions}
            onToggle={(value) => update("fonctions", toggleChip(form.fonctions, value))}
          />
        </div>
      </section>

      <section className="circuit-form-section">
        <h3 className="circuit-section-title">Monuments souhaités</h3>
        <p className="circuit-section-hint">
          Optionnel : choisissez quelques monuments que vous souhaitez absolument inclure.
        </p>
        <ChipRow
          options={visibleMonuments}
          selected={form.must_visit}
          onToggle={(value) => update("must_visit", toggleChip(form.must_visit, value))}
        />
        <button
          type="button"
          className="circuit-toggle-more"
          onClick={() => setShowAllMonuments((open) => !open)}
        >
          {showAllMonuments ? "Voir moins" : "Voir plus"}
        </button>
      </section>

      <div className="circuit-form-actions">
        <button type="submit" className="btn-primary circuit-submit-btn" disabled={loading}>
          {loading ? "Optimisation du circuit…" : "Créer mon circuit"}
        </button>
        <button
          type="button"
          className="btn-secondary btn-compact circuit-reset-btn"
          disabled={loading}
          onClick={() => onChange({ ...DEFAULT_CIRCUIT_FORM, must_visit: [...DEFAULT_CIRCUIT_FORM.must_visit] })}
        >
          Réinitialiser
        </button>
      </div>
    </form>
  );
}

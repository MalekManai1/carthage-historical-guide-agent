export const PERIOD_OPTIONS = [
  "Romaine",
  "Punique",
  "Byzantine",
  "Coloniale",
] as const;

export const FUNCTION_OPTIONS = [
  "musee",
  "religieux",
  "culturel",
  "habitation",
] as const;

/** Primary monuments shown by default in the form. */
export const FEATURED_MONUMENT_OPTIONS = [
  "Thermes d'Antonin",
  "Theatre",
  "Tophet",
  "Ports puniques",
  "La colline de Byrsa",
  "Musée national de Carthage",
  "Quartier Magon",
] as const;

/** Additional monuments revealed via “Voir plus”. */
export const EXTRA_MONUMENT_OPTIONS = [
  "Parc des villas romaines",
  "Amphithéâtre de Carthage",
  "Odéon",
  "Musée Océanographique (Dar El Hout)",
  "Beit El Hikma",
  "Maison de Dionysos",
] as const;

export const DEFAULT_CIRCUIT_FORM = {
  type_tarif: "etudiant" as const,
  budget_max: "30",
  transport: "walking" as const,
  mobilite: "normale" as const,
  duration_minutes: "120",
  start_time: "09:00",
  end_time: "11:00",
  epoques: ["Romaine", "Punique"],
  fonctions: ["musee", "culturel"],
  must_visit: ["Thermes d'Antonin"] as string[],
};

// Etiquetas de las etapas del torneo, centralizadas para usarlas en
// MatchList (Partidos) y KnockoutView (Llaves).

export const ETAPAS: Record<string, string> = {
  GROUP_STAGE: "Fase de grupos",
  LAST_32: "Dieciseisavos de final",
  LAST_16: "Octavos de final",
  QUARTER_FINALS: "Cuartos de final",
  SEMI_FINALS: "Semifinales",
  THIRD_PLACE: "Tercer puesto",
  FINAL: "Final",
};

// Versión corta para el selector de rondas y los headers del cuadro.
export const ETAPAS_CORTAS: Record<string, string> = {
  LAST_32: "16avos",
  LAST_16: "Octavos",
  QUARTER_FINALS: "Cuartos",
  SEMI_FINALS: "Semis",
  THIRD_PLACE: "3er puesto",
  FINAL: "Final",
};

// Cuadro principal en orden (el tercer puesto se muestra aparte).
export const RONDAS_LLAVE = [
  "LAST_32",
  "LAST_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "FINAL",
] as const;

export type RondaLlave = (typeof RONDAS_LLAVE)[number];

// Todas las etapas eliminatorias (incluye tercer puesto).
export const ETAPAS_ELIMINATORIAS = [...RONDAS_LLAVE, "THIRD_PLACE"] as const;

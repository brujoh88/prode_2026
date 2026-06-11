import { useSyncExternalStore } from "react";

// Reloj compartido: un único setInterval alimenta a todas las filas que lo usen,
// en vez de un timer por componente. Leído con useSyncExternalStore para evitar
// setState-en-efecto y el mismatch de hidratación (en SSR todavía no hay hora).
let ahoraMs = 0;
let intervalo: ReturnType<typeof setInterval> | null = null;
const oyentes = new Set<() => void>();

function tick() {
  ahoraMs = Date.now();
  for (const o of oyentes) o();
}

function subscribir(cb: () => void) {
  oyentes.add(cb);
  if (intervalo === null) {
    ahoraMs = Date.now();
    intervalo = setInterval(tick, 1000);
  }
  return () => {
    oyentes.delete(cb);
    if (oyentes.size === 0 && intervalo !== null) {
      clearInterval(intervalo);
      intervalo = null;
    }
  };
}

const getSnapshot = () => ahoraMs; // estable entre ticks (mismo número)
const getServerSnapshot = () => 0; // en el servidor no hay reloj

// Hora actual en ms, o null hasta que monte en el cliente.
export function useAhoraMs(): number | null {
  const ms = useSyncExternalStore(subscribir, getSnapshot, getServerSnapshot);
  return ms === 0 ? null : ms;
}

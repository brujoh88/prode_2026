"use client";

import { useSyncExternalStore } from "react";

type Tema = "light" | "dark";

// Store externo del tema, leído con useSyncExternalStore (sin setState en efecto).
// La fuente de verdad es localStorage("tema"); si no hay elección, cae al sistema.
const oyentes = new Set<() => void>();
function avisar() {
  for (const o of oyentes) o();
}

function subscribir(cb: () => void) {
  oyentes.add(cb);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", cb);
  mq.addEventListener("change", cb);
  return () => {
    oyentes.delete(cb);
    window.removeEventListener("storage", cb);
    mq.removeEventListener("change", cb);
  };
}

function leer(): Tema {
  const t = localStorage.getItem("tema");
  if (t === "light" || t === "dark") return t;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// En el servidor no hay tema definido todavía → placeholder sin parpadeo.
const leerEnServidor = (): Tema | null => null;

// Botón para alternar entre modo claro y oscuro. Persiste en localStorage y lo
// aplica vía data-theme en <html> (el script inline del layout evita el flash).
export function ThemeToggle() {
  const tema = useSyncExternalStore(subscribir, leer, leerEnServidor);

  function alternar() {
    const nuevo: Tema = leer() === "dark" ? "light" : "dark";
    localStorage.setItem("tema", nuevo);
    document.documentElement.dataset.theme = nuevo;
    avisar();
  }

  // Hasta montar en cliente no sabemos el tema real: placeholder del mismo tamaño
  if (tema === null) {
    return <span className="h-9 w-9 shrink-0" aria-hidden="true" />;
  }

  const esOscuro = tema === "dark";
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={esOscuro ? "Modo claro" : "Modo oscuro"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg leading-none transition-colors hover:bg-white/15"
    >
      {esOscuro ? "☀️" : "🌙"}
    </button>
  );
}

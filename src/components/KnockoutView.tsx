"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { PredictionRow } from "@/components/PredictionRow";
import {
  ETAPAS_CORTAS,
  ETAPAS_ELIMINATORIAS,
  RONDAS_LLAVE,
} from "@/lib/etapas";
import type { Match, Prediction } from "@/lib/types";

// Alto fijo por partido de la primera ronda. Da el alto total del cuadro para
// que el flex-1 reparta las celdas en partes iguales y los conectores alineen.
const ALTO_FILA = 168;

export function KnockoutView({
  matches,
  predictions,
  userId,
}: {
  matches: Match[];
  predictions: Prediction[];
  userId: string;
}) {
  const predPorPartido = useMemo(
    () => new Map(predictions.map((p) => [p.match_id, p])),
    [predictions]
  );

  // Partidos agrupados por etapa, cada ronda ordenada por id (orden del cuadro)
  const porEtapa = useMemo(() => {
    const m = new Map<string, Match[]>();
    for (const e of ETAPAS_ELIMINATORIAS) m.set(e, []);
    for (const partido of matches) {
      if (partido.stage && m.has(partido.stage)) {
        m.get(partido.stage)!.push(partido);
      }
    }
    for (const arr of m.values()) arr.sort((a, b) => a.id - b.id);
    return m;
  }, [matches]);

  const rondasDisponibles = useMemo(
    () => ETAPAS_ELIMINATORIAS.filter((e) => (porEtapa.get(e)?.length ?? 0) > 0),
    [porEtapa]
  );

  const [rondaActiva, setRondaActiva] = useState<string | null>(
    rondasDisponibles[0] ?? null
  );

  const carruselRef = useRef<HTMLDivElement>(null);
  const activoRef = useRef<HTMLButtonElement>(null);
  function desplazar(dir: number) {
    const el = carruselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  }
  useEffect(() => {
    activoRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [rondaActiva]);

  if (!rondasDisponibles.length) {
    return (
      <p className="rounded-xl border border-borde bg-card p-6 text-center text-sm opacity-70">
        Todavía no hay cruces definidos. Cuando arranque la fase eliminatoria, el
        cuadro aparece acá.
      </p>
    );
  }

  const ronda =
    rondaActiva && (rondasDisponibles as string[]).includes(rondaActiva)
      ? rondaActiva
      : rondasDisponibles[0];
  const partidosRonda = porEtapa.get(ronda) ?? [];

  // Rondas del cuadro principal presentes (sin tercer puesto) y alto del cuadro
  const rondasCuadro = RONDAS_LLAVE.filter(
    (e) => (porEtapa.get(e)?.length ?? 0) > 0
  );
  const maxPartidos = Math.max(
    1,
    ...rondasCuadro.map((e) => porEtapa.get(e)!.length)
  );
  const altoCuadro = maxPartidos * ALTO_FILA;
  const tercerPuesto = porEtapa.get("THIRD_PLACE") ?? [];

  function fila(m: Match) {
    return (
      <PredictionRow
        key={m.id}
        match={m}
        prediction={predPorPartido.get(m.id) ?? null}
        userId={userId}
      />
    );
  }

  return (
    <div>
      {/* ── Mobile / tablet: selector de rondas + lista ───────────────── */}
      <div className="flex flex-col gap-5 lg:hidden">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Rondas anteriores"
            onClick={() => desplazar(-1)}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-borde bg-card text-lg leading-none text-celeste-profundo transition-colors hover:bg-celeste-claro sm:flex dark:text-celeste"
          >
            ‹
          </button>

          <div
            ref={carruselRef}
            className="flex flex-1 snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {rondasDisponibles.map((e) => (
              <button
                key={e}
                ref={e === ronda ? activoRef : null}
                onClick={() => setRondaActiva(e)}
                className={`flex min-h-11 shrink-0 basis-[calc((100%-1rem)/3)] snap-start items-center justify-center rounded-xl px-2 text-sm font-bold transition-colors sm:basis-[calc((100%-1.5rem)/4)] ${
                  e === ronda
                    ? "bg-celeste-oscuro text-white shadow-sm"
                    : "bg-celeste-claro text-celeste-profundo hover:bg-celeste/20 dark:text-celeste"
                }`}
              >
                {ETAPAS_CORTAS[e] ?? e}
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-label="Rondas siguientes"
            onClick={() => desplazar(1)}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-borde bg-card text-lg leading-none text-celeste-profundo transition-colors hover:bg-celeste-claro sm:flex dark:text-celeste"
          >
            ›
          </button>
        </div>

        <motion.div
          key={ronda}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="flex flex-col gap-2.5"
        >
          {partidosRonda.map(fila)}
        </motion.div>
      </div>

      {/* ── Desktop: árbol de llaves con scroll horizontal ────────────── */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto pb-4">
          <div className="flex min-w-max gap-8">
            {rondasCuadro.map((etapa, idx) => {
              const arr = porEtapa.get(etapa)!;
              const esFinal = idx === rondasCuadro.length - 1;
              return (
                <div key={etapa} className="flex w-72 shrink-0 flex-col gap-3">
                  <h3 className="text-center text-xs font-bold uppercase tracking-wide text-celeste-oscuro">
                    {ETAPAS_CORTAS[etapa] ?? etapa}
                  </h3>
                  <div className="flex flex-col" style={{ height: altoCuadro }}>
                    {arr.map((m) => (
                      <div
                        key={m.id}
                        className={`llave-celda ${esFinal ? "" : "con-salida"}`}
                      >
                        {fila(m)}
                      </div>
                    ))}
                  </div>

                  {esFinal && tercerPuesto.length > 0 && (
                    <div className="mt-2">
                      <h3 className="mb-3 text-center text-xs font-bold uppercase tracking-wide text-celeste-oscuro">
                        {ETAPAS_CORTAS.THIRD_PLACE}
                      </h3>
                      {tercerPuesto.map(fila)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

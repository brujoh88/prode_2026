"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { PredictionRow } from "@/components/PredictionRow";
import { ETAPAS } from "@/lib/etapas";
import type { Match, Prediction } from "@/lib/types";

const TZ = "America/Argentina/Buenos_Aires";

const contenedor = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 28 },
  },
};

type Pestana = "anteriores" | "hoy" | "proximos";

const PESTANAS: { id: Pestana; label: string }[] = [
  { id: "anteriores", label: "⏪ Anteriores" },
  { id: "hoy", label: "🔥 Hoy" },
  { id: "proximos", label: "Próximos ⏩" },
];

function diaDe(fechaUtc: string): string {
  return new Date(fechaUtc).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  });
}

export function MatchList({
  matches,
  predictions,
  userId,
}: {
  matches: Match[];
  predictions: Prediction[];
  userId: string;
}) {
  const [verTodos, setVerTodos] = useState(false);
  const predPorPartido = new Map(predictions.map((p) => [p.match_id, p]));
  const ahora = new Date();
  const hoy = diaDe(ahora.toISOString());

  const deHoy = matches.filter((m) => diaDe(m.utc_kickoff) === hoy);
  const resto = matches.filter((m) => diaDe(m.utc_kickoff) !== hoy);

  // Días anteriores a hoy (ya jugados) y días posteriores (por venir)
  const pasados = resto.filter((m) => new Date(m.utc_kickoff) < ahora);
  const futuros = resto.filter((m) => new Date(m.utc_kickoff) >= ahora);

  const [pestana, setPestana] = useState<Pestana>(
    deHoy.length > 0 ? "hoy" : "proximos"
  );

  // En la vista compacta mostramos solo los próximos 5 partidos que todavía no arrancaron
  const proximos = futuros.slice(0, 5);
  const colapsable = futuros.length > proximos.length;
  const mostrarColapsado = colapsable && !verTodos;

  // Resumen rápido de aciertos sobre los partidos anteriores ya puntuados
  const pasadosConPunto = pasados.filter((m) => predPorPartido.has(m.id));
  const exactos = pasadosConPunto.filter(
    (m) => predPorPartido.get(m.id)!.points === 3
  ).length;
  const puntosPasados = pasadosConPunto.reduce(
    (acc, m) => acc + (predPorPartido.get(m.id)!.points ?? 0),
    0
  );

  function agruparPorDia(lista: Match[]): [string, Match[]][] {
    const grupos = new Map<string, Match[]>();
    for (const m of lista) {
      const dia = diaDe(m.utc_kickoff);
      if (!grupos.has(dia)) grupos.set(dia, []);
      grupos.get(dia)!.push(m);
    }
    return [...grupos.entries()];
  }

  const gruposFuturos = agruparPorDia(mostrarColapsado ? proximos : futuros);
  // Anteriores del día más reciente al más viejo
  const gruposPasados = agruparPorDia(pasados).reverse();

  function renderPartido(m: Match) {
    return (
      <motion.div key={m.id} variants={item}>
        {m.stage && m.stage !== "GROUP_STAGE" && (
          <p className="mb-1 text-xs font-bold text-celeste-oscuro">
            {ETAPAS[m.stage] ?? m.stage}
          </p>
        )}
        <PredictionRow
          match={m}
          prediction={predPorPartido.get(m.id) ?? null}
          userId={userId}
        />
      </motion.div>
    );
  }

  function renderGruposPorDia(grupos: [string, Match[]][]) {
    return (
      <div className="flex flex-col gap-5">
        {grupos.map(([dia, partidos]) => (
          <div key={dia}>
            <motion.p
              variants={item}
              className="mb-2 text-xs font-bold capitalize text-celeste-oscuro/75"
            >
              {dia}
            </motion.p>
            <div className="flex flex-col gap-2.5">
              {partidos.map(renderPartido)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex rounded-xl border border-borde bg-card p-1 shadow-sm">
        {PESTANAS.map((p) => {
          const activa = pestana === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPestana(p.id)}
              className="relative flex-1 rounded-lg py-2 text-sm font-bold"
            >
              {activa && (
                <motion.span
                  layoutId="pestana-activa"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-lg bg-celeste-oscuro"
                />
              )}
              <span
                className={`relative z-10 transition-colors ${
                  activa ? "text-white" : "text-celeste-oscuro opacity-70 dark:text-celeste"
                }`}
              >
                {p.label}
              </span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={pestana}
        variants={contenedor}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-7"
      >
        {pestana === "hoy" &&
          (deHoy.length > 0 ? (
            <section className="flex flex-col gap-2.5">
              {deHoy.map(renderPartido)}
            </section>
          ) : (
            <motion.p
              variants={item}
              className="rounded-xl border border-borde bg-card p-4 text-center text-sm opacity-70"
            >
              Hoy no se juega ningún partido. Mirá los próximos ⏩
            </motion.p>
          ))}

        {pestana === "proximos" && (
          <section>
            {futuros.length > 0 ? (
              <>
                {renderGruposPorDia(gruposFuturos)}
                {mostrarColapsado && (
                  <motion.button
                    variants={item}
                    onClick={() => setVerTodos(true)}
                    className="mt-4 w-full rounded-xl border border-celeste-oscuro/40 bg-celeste-claro py-3 text-sm font-bold text-celeste-profundo transition-colors hover:bg-celeste/20 dark:text-celeste"
                  >
                    Ver todos los próximos ({futuros.length})
                  </motion.button>
                )}
              </>
            ) : (
              <motion.p
                variants={item}
                className="rounded-xl border border-borde bg-card p-4 text-center text-sm opacity-70"
              >
                No quedan partidos por jugar. ¡Se terminó el Mundial! 🏆
              </motion.p>
            )}
          </section>
        )}

        {pestana === "anteriores" && (
          <section>
            {pasados.length > 0 ? (
              <>
                {pasadosConPunto.length > 0 && (
                  <motion.div variants={item} className="mb-2.5">
                    <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-bold text-green-600 dark:text-green-400">
                      {exactos} {exactos === 1 ? "clavada" : "clavadas"} ·{" "}
                      {puntosPasados} pts
                    </span>
                  </motion.div>
                )}
                {renderGruposPorDia(gruposPasados)}
              </>
            ) : (
              <motion.p
                variants={item}
                className="rounded-xl border border-borde bg-card p-4 text-center text-sm opacity-70"
              >
                Todavía no hay partidos jugados.
              </motion.p>
            )}
          </section>
        )}
      </motion.div>
    </div>
  );
}

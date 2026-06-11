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

  // En la vista compacta mostramos solo los próximos partidos que todavía no arrancaron
  const futuros = resto.filter((m) => new Date(m.utc_kickoff) >= ahora);
  const proximos = futuros.slice(0, 5);
  const colapsable = resto.length > proximos.length;
  const mostrarColapsado = colapsable && !verTodos;

  const grupos = new Map<string, Match[]>();
  for (const m of resto) {
    const dia = diaDe(m.utc_kickoff);
    if (!grupos.has(dia)) grupos.set(dia, []);
    grupos.get(dia)!.push(m);
  }

  // Los próximos también agrupados por día, para mostrar la fecha en la vista compacta
  const gruposProximos = new Map<string, Match[]>();
  for (const m of proximos) {
    const dia = diaDe(m.utc_kickoff);
    if (!gruposProximos.has(dia)) gruposProximos.set(dia, []);
    gruposProximos.get(dia)!.push(m);
  }

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

  return (
    <motion.div
      variants={contenedor}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-7"
    >
      {deHoy.length > 0 && (
        <section>
          <motion.h2
            variants={item}
            className="mb-2.5 inline-block rounded-full bg-celeste px-4 py-1.5 text-sm font-black uppercase tracking-wide text-white shadow-sm"
          >
            🔥 Se juega hoy
          </motion.h2>
          <div className="flex flex-col gap-2.5">{deHoy.map(renderPartido)}</div>
        </section>
      )}

      {mostrarColapsado ? (
        <section>
          <motion.h2
            variants={item}
            className="mb-2.5 text-sm font-bold text-celeste-oscuro"
          >
            Próximos partidos
          </motion.h2>
          <div className="flex flex-col gap-5">
            {[...gruposProximos.entries()].map(([dia, partidos]) => (
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
          <motion.button
            variants={item}
            onClick={() => setVerTodos(true)}
            className="mt-4 w-full rounded-xl border border-celeste-oscuro/40 bg-celeste-claro py-3 text-sm font-bold text-celeste-profundo transition-colors hover:bg-celeste/20 dark:text-celeste"
          >
            Ver todos los partidos ({resto.length})
          </motion.button>
        </section>
      ) : (
        [...grupos.entries()].map(([dia, partidos]) => (
          <section key={dia}>
            <motion.h2
              variants={item}
              className="mb-2.5 text-sm font-bold capitalize text-celeste-oscuro"
            >
              {dia}
            </motion.h2>
            <div className="flex flex-col gap-2.5">
              {partidos.map(renderPartido)}
            </div>
          </section>
        ))
      )}
    </motion.div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { PredictionRow } from "@/components/PredictionRow";
import { nombrePais } from "@/lib/paises";
import type { Match, Prediction } from "@/lib/types";

type Posicion = {
  equipo: string;
  crest: string | null;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dif: number;
  pts: number;
};

function tablaDelGrupo(partidos: Match[]): Posicion[] {
  const tabla = new Map<string, Posicion>();

  function asegurar(equipo: string, crest: string | null): Posicion {
    let fila = tabla.get(equipo);
    if (!fila) {
      fila = { equipo, crest, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0, pts: 0 };
      tabla.set(equipo, fila);
    }
    if (!fila.crest && crest) fila.crest = crest;
    return fila;
  }

  for (const m of partidos) {
    // Los equipos aparecen en la tabla aunque todavía no hayan jugado
    const local = asegurar(m.home_team, m.home_crest);
    const visita = asegurar(m.away_team, m.away_crest);

    if (m.status !== "FINISHED" || m.home_score === null || m.away_score === null) {
      continue;
    }

    const gl = m.home_score;
    const gv = m.away_score;
    local.pj++;
    visita.pj++;
    local.gf += gl;
    local.gc += gv;
    visita.gf += gv;
    visita.gc += gl;

    if (gl > gv) {
      local.pg++;
      local.pts += 3;
      visita.pp++;
    } else if (gl < gv) {
      visita.pg++;
      visita.pts += 3;
      local.pp++;
    } else {
      local.pe++;
      visita.pe++;
      local.pts += 1;
      visita.pts += 1;
    }
  }

  for (const fila of tabla.values()) fila.dif = fila.gf - fila.gc;

  return [...tabla.values()].sort(
    (a, b) =>
      b.pts - a.pts ||
      b.dif - a.dif ||
      b.gf - a.gf ||
      nombrePais(a.equipo).localeCompare(nombrePais(b.equipo))
  );
}

function Bandera({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return <span className="text-sm opacity-50">⚽</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="h-5 w-5 rounded-sm object-contain" loading="lazy" />
  );
}

export function GroupView({
  matches,
  predictions,
  userId,
}: {
  matches: Match[];
  predictions: Prediction[];
  userId: string;
}) {
  const deGrupos = useMemo(
    () => matches.filter((m) => m.stage === "GROUP_STAGE" && m.group_name),
    [matches]
  );

  const gruposDisponibles = useMemo(() => {
    const set = new Set<string>();
    for (const m of deGrupos) set.add(m.group_name!);
    return [...set].sort();
  }, [deGrupos]);

  const [grupoActivo, setGrupoActivo] = useState<string | null>(
    gruposDisponibles[0] ?? null
  );

  const predPorPartido = new Map(predictions.map((p) => [p.match_id, p]));

  if (!gruposDisponibles.length) {
    return (
      <p className="rounded-xl border border-borde bg-card p-6 text-center text-sm opacity-70">
        Todavía no hay grupos cargados. Cuando estén los partidos de la fase de
        grupos, aparecen acá.
      </p>
    );
  }

  const grupo = grupoActivo ?? gruposDisponibles[0];
  const partidosGrupo = deGrupos
    .filter((m) => m.group_name === grupo)
    .sort((a, b) => a.utc_kickoff.localeCompare(b.utc_kickoff));
  const tabla = tablaDelGrupo(partidosGrupo);

  return (
    <div className="flex flex-col gap-5">
      {/* Selector de grupos */}
      <div className="flex flex-wrap gap-2">
        {gruposDisponibles.map((g) => (
          <button
            key={g}
            onClick={() => setGrupoActivo(g)}
            className={`min-h-9 rounded-full px-3.5 text-sm font-bold transition-colors ${
              g === grupo
                ? "bg-celeste-oscuro text-white shadow-sm"
                : "bg-celeste-claro text-celeste-profundo hover:bg-celeste/20 dark:text-celeste"
            }`}
          >
            Grupo {g}
          </button>
        ))}
      </div>

      <motion.div
        key={grupo}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="flex flex-col gap-5"
      >
        {/* Tabla de posiciones */}
        <div className="overflow-x-auto rounded-xl border border-borde bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borde bg-celeste-claro text-xs font-bold uppercase tracking-wide text-celeste-profundo dark:text-celeste">
                <th className="px-3 py-2.5 text-left">Selección</th>
                <th className="px-2 py-2.5 text-center" title="Partidos jugados">PJ</th>
                <th className="px-2 py-2.5 text-center" title="Ganados">G</th>
                <th className="px-2 py-2.5 text-center" title="Empatados">E</th>
                <th className="px-2 py-2.5 text-center" title="Perdidos">P</th>
                <th className="px-2 py-2.5 text-center" title="Diferencia de gol">DIF</th>
                <th className="px-2 py-2.5 text-center" title="Goles a favor">GF</th>
                <th className="px-3 py-2.5 text-center" title="Puntos">PTS</th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((fila, i) => (
                <tr
                  key={fila.equipo}
                  className={`border-b border-borde/50 last:border-0 ${
                    i < 2 ? "bg-celeste/10" : ""
                  }`}
                >
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="w-4 text-xs font-bold opacity-50">{i + 1}</span>
                      <Bandera src={fila.crest} alt={nombrePais(fila.equipo)} />
                      <span className="truncate font-semibold">
                        {nombrePais(fila.equipo)}
                      </span>
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{fila.pj}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{fila.pg}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{fila.pe}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{fila.pp}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums">
                    {fila.dif > 0 ? `+${fila.dif}` : fila.dif}
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{fila.gf}</td>
                  <td className="px-3 py-2.5 text-center font-black tabular-nums text-celeste-profundo dark:text-celeste">
                    {fila.pts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-3 py-2 text-[11px] opacity-50">
            Los 2 primeros (resaltados) avanzan de fase.
          </p>
        </div>

        {/* Fixture del grupo */}
        <section>
          <h2 className="mb-2.5 text-sm font-bold text-celeste-oscuro">
            Partidos del Grupo {grupo}
          </h2>
          <div className="flex flex-col gap-2.5">
            {partidosGrupo.map((m) => (
              <PredictionRow
                key={m.id}
                match={m}
                prediction={predPorPartido.get(m.id) ?? null}
                userId={userId}
              />
            ))}
          </div>
        </section>
      </motion.div>
    </div>
  );
}

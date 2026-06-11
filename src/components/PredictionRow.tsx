"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAhoraMs } from "@/lib/useAhora";
import { nombrePais, esArgentina } from "@/lib/paises";
import type { Match, Prediction } from "@/lib/types";

// Lluvia albiceleste y dorada cuando la clavás justo (+3), una sola vez por partido
function festejar(matchId: number) {
  const clave = `confetti_${matchId}`;
  if (typeof window === "undefined" || localStorage.getItem(clave)) return;
  localStorage.setItem(clave, "1");
  confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#74acdf", "#ffffff", "#f6b40e"],
  });
}

const PUNTOS_ESTILO: Record<number, { clase: string; texto: string }> = {
  3: { clase: "bg-green-500/15 text-green-600 dark:text-green-400", texto: "¡La clavaste! +3" },
  1: { clase: "bg-dorado/20 text-dorado-oscuro dark:text-dorado", texto: "Pegaste el pálpito +1" },
  0: { clase: "bg-red-500/10 text-red-500", texto: "Ni cerca, 0" },
};

function limpiarGoles(v: string): string {
  const digitos = v.replace(/\D/g, "").slice(0, 2);
  if (digitos === "") return "";
  return String(Math.min(Number(digitos), 30));
}

function Bandera({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center text-base opacity-50">
        ⚽
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-6 w-6 shrink-0 rounded-sm object-contain drop-shadow-sm"
      loading="lazy"
    />
  );
}

function cuentaRegresiva(kickoff: Date, ahora: Date): string | null {
  const ms = kickoff.getTime() - ahora.getTime();
  if (ms <= 0 || ms > 24 * 60 * 60 * 1000) return null;
  const totalSeg = Math.floor(ms / 1000);
  const horas = Math.floor(totalSeg / 3600);
  const minutos = Math.floor((totalSeg % 3600) / 60);
  const segundos = totalSeg % 60;
  const dosD = (n: number) => String(n).padStart(2, "0");
  return horas > 0
    ? `Cierra en ${horas}:${dosD(minutos)}:${dosD(segundos)}`
    : `¡Cierra en ${minutos}:${dosD(segundos)}!`;
}

export function PredictionRow({
  match,
  prediction,
  userId,
}: {
  match: Match;
  prediction: Prediction | null;
  userId: string;
}) {
  const [predHome, setPredHome] = useState(
    prediction ? String(prediction.pred_home) : ""
  );
  const [predAway, setPredAway] = useState(
    prediction ? String(prediction.pred_away) : ""
  );
  const [guardado, setGuardado] = useState<{ h: number; a: number } | null>(
    prediction ? { h: prediction.pred_home, a: prediction.pred_away } : null
  );
  const [guardando, setGuardando] = useState(false);
  // Reloj compartido: tickea cada segundo en el cliente (null hasta montar)
  const ahoraMs = useAhoraMs();
  const ahora = ahoraMs === null ? null : new Date(ahoraMs);

  useEffect(() => {
    if (match.status === "FINISHED" && prediction?.points === 3) {
      festejar(match.id);
    }
  }, [match.status, match.id, prediction?.points]);

  const kickoff = new Date(match.utc_kickoff);
  const yaEmpezo = ahora ? kickoff <= ahora : false;
  const terminado = match.status === "FINISHED";
  const enJuego = yaEmpezo && !terminado;
  const countdown = ahora && !yaEmpezo ? cuentaRegresiva(kickoff, ahora) : null;
  const conArgentina = esArgentina(match);

  const local = nombrePais(match.home_team);
  const visitante = nombrePais(match.away_team);
  const hora = kickoff.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const completo = predHome !== "" && predAway !== "";
  const hayCambios = guardado
    ? predHome !== String(guardado.h) || predAway !== String(guardado.a)
    : completo;

  async function guardar() {
    if (!completo || guardando) return;
    setGuardando(true);
    const supabase = createClient();
    const h = Number(predHome);
    const a = Number(predAway);
    const { error } = await supabase.from("predictions").upsert(
      {
        user_id: userId,
        match_id: match.id,
        pred_home: h,
        pred_away: a,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,match_id" }
    );
    setGuardando(false);
    if (error) {
      toast.error(
        new Date(match.utc_kickoff) <= new Date()
          ? "Este partido ya arrancó, no se toca más."
          : "Uy, no se guardó. Probá de nuevo."
      );
      return;
    }
    setGuardado({ h, a });
    toast.success(`La jugaste: ${local} ${h} - ${a} ${visitante}`);
  }

  return (
    <div
      className={`rounded-xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-md ${
        conArgentina
          ? "border-celeste ring-1 ring-celeste/40"
          : "border-borde"
      }`}
    >
      {/* Meta: hora + estado */}
      <div className="mb-2 flex items-center gap-2 text-xs">
        <span className="font-semibold opacity-60">🕐 {hora} hs</span>
        {conArgentina && (
          <span className="font-bold text-celeste-oscuro">🇦🇷 ¡Juega la Scaloneta!</span>
        )}
        {countdown && (
          <span className="ml-auto rounded-full bg-dorado/20 px-2 py-0.5 font-bold tabular-nums text-dorado-oscuro dark:text-dorado">
            ⏱ {countdown}
          </span>
        )}
        {enJuego && (
          <span className="ml-auto flex items-center gap-1 font-bold text-red-500">
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
            >
              🔴
            </motion.span>
            Se juega ahora
          </span>
        )}
        {terminado && <span className="ml-auto font-semibold opacity-50">Final</span>}
      </div>

      {/* Equipos + marcador/inputs */}
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="truncate text-sm font-semibold sm:text-base">{local}</span>
          <Bandera src={match.home_crest} alt={local} />
        </div>

        {yaEmpezo || terminado ? (
          <div className="flex flex-col items-center px-1">
            <span className="font-mono text-xl font-black tabular-nums">
              {match.home_score ?? "–"} - {match.away_score ?? "–"}
            </span>
            {guardado && (
              <span className="text-xs opacity-60">
                Jugaste {guardado.h} - {guardado.a}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-1">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={predHome}
              onChange={(e) => setPredHome(limpiarGoles(e.target.value))}
              placeholder="·"
              className="h-12 w-12 rounded-lg border border-borde bg-background text-center text-lg font-bold outline-none transition-colors focus:border-celeste-oscuro focus:ring-2 focus:ring-celeste/40"
              aria-label={`Goles de ${local}`}
            />
            <span className="text-sm font-bold opacity-40">-</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={predAway}
              onChange={(e) => setPredAway(limpiarGoles(e.target.value))}
              placeholder="·"
              className="h-12 w-12 rounded-lg border border-borde bg-background text-center text-lg font-bold outline-none transition-colors focus:border-celeste-oscuro focus:ring-2 focus:ring-celeste/40"
              aria-label={`Goles de ${visitante}`}
            />
          </div>
        )}

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Bandera src={match.away_crest} alt={visitante} />
          <span className="truncate text-sm font-semibold sm:text-base">{visitante}</span>
        </div>
      </div>

      {/* Acción / estado del pronóstico */}
      <div className="mt-2.5 flex min-h-9 items-center justify-center">
        {terminado ? (
          guardado && prediction ? (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${PUNTOS_ESTILO[prediction.points]?.clase ?? ""}`}
            >
              {PUNTOS_ESTILO[prediction.points]?.texto ?? `${prediction.points} pts`}
            </span>
          ) : (
            <span className="text-xs opacity-50">No la jugaste 😬</span>
          )
        ) : yaEmpezo ? (
          !guardado && <span className="text-xs opacity-50">No llegaste a jugarla 😬</span>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {guardado && !hayCambios ? (
              <motion.span
                key="guardado"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-600 dark:text-green-400"
              >
                ✓ Guardado — tocá los números si querés cambiarlo
              </motion.span>
            ) : (
              <motion.button
                key={guardado ? "actualizar" : "jugala"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                whileTap={{ scale: 0.95 }}
                onClick={guardar}
                disabled={!completo || !hayCambios || guardando}
                className={`min-h-9 rounded-full px-5 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  guardado
                    ? "bg-dorado-oscuro hover:bg-dorado"
                    : "bg-celeste-oscuro hover:bg-celeste-profundo"
                }`}
              >
                {guardando ? "Guardando…" : guardado ? "Actualizar" : "¡Jugala!"}
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

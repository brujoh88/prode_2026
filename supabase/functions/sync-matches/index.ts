// Edge Function: sincroniza fixture + resultados del Mundial 2026 desde
// football-data.org y los escribe en la tabla `matches`.
//
// Corre dentro de Supabase (no depende de la app Next.js). Se dispara desde
// pg_cron cada 15 min — ver la migración `sync_matches_cron`.
//
// Al pasar un partido a FINISHED, el trigger `trg_recalc_points` recalcula los
// puntos de los pronósticos de ese partido. Acá no hay scoring.
//
// Equivale a la lógica de `src/app/api/sync/route.ts`, pero usando las env vars
// que Supabase inyecta solo en el runtime de Edge Functions:
//   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (automáticas)
//   - FOOTBALL_DATA_TOKEN                       (secret, hay que setearla)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type FootballDataMatch = {
  id: number;
  stage: string | null;
  group: string | null;
  matchday: number | null;
  utcDate: string;
  status: string;
  homeTeam: { name: string | null; crest: string | null } | null;
  awayTeam: { name: string | null; crest: string | null } | null;
  score: { fullTime: { home: number | null; away: number | null } } | null;
};

Deno.serve(async () => {
  const token = Deno.env.get("FOOTBALL_DATA_TOKEN");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!token) {
    return Response.json(
      { error: "Falta el secret FOOTBALL_DATA_TOKEN en la función" },
      { status: 500 }
    );
  }
  if (!supabaseUrl || !serviceKey) {
    return Response.json(
      { error: "Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    );
  }

  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches",
    { headers: { "X-Auth-Token": token } }
  );
  if (!res.ok) {
    return Response.json(
      { error: `football-data.org respondió ${res.status}`, detail: await res.text() },
      { status: 502 }
    );
  }

  const data: { matches?: FootballDataMatch[] } = await res.json();
  const partidos = data.matches ?? [];

  const filas = partidos.map((m) => ({
    id: m.id,
    stage: m.stage,
    group_name: m.group,
    matchday: m.matchday,
    home_team: m.homeTeam?.name ?? "A definir",
    away_team: m.awayTeam?.name ?? "A definir",
    home_crest: m.homeTeam?.crest ?? null,
    away_crest: m.awayTeam?.crest ?? null,
    utc_kickoff: m.utcDate,
    status: m.status,
    home_score: m.score?.fullTime?.home ?? null,
    away_score: m.score?.fullTime?.away ?? null,
    updated_at: new Date().toISOString(),
  }));

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { error } = await admin.from("matches").upsert(filas);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const terminados = filas.filter((f) => f.status === "FINISHED").length;
  return Response.json({
    ok: true,
    partidos: filas.length,
    terminados,
    sincronizado: new Date().toISOString(),
  });
});

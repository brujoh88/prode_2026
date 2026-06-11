import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Sincroniza fixture + resultados del Mundial 2026 desde football-data.org.
// Al actualizar un partido a FINISHED, el trigger de Postgres recalcula
// los puntos de todos los pronósticos de ese partido — acá no hay scoring.
//
// Uso:  GET /api/sync?secret=<SYNC_SECRET>
//       POST /api/sync  (header: Authorization: Bearer <SYNC_SECRET>)

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

async function sync(): Promise<NextResponse> {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!token || token === "PEGAR_ACA") {
    return NextResponse.json(
      { error: "Falta FOOTBALL_DATA_TOKEN en .env.local" },
      { status: 500 }
    );
  }
  if (!secretKey || secretKey === "PEGAR_ACA") {
    return NextResponse.json(
      { error: "Falta SUPABASE_SECRET_KEY en .env.local" },
      { status: 500 }
    );
  }

  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches",
    { headers: { "X-Auth-Token": token }, cache: "no-store" }
  );
  if (!res.ok) {
    return NextResponse.json(
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

  // Cliente admin (service role): bypasea RLS solo en el servidor
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey,
    { auth: { persistSession: false } }
  );

  const { error } = await admin.from("matches").upsert(filas);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const terminados = filas.filter((f) => f.status === "FINISHED").length;
  return NextResponse.json({
    ok: true,
    partidos: filas.length,
    terminados,
    sincronizado: new Date().toISOString(),
  });
}

function autorizado(request: Request): boolean {
  const secret = process.env.SYNC_SECRET;
  if (!secret) return false;
  const url = new URL(request.url);
  return (
    request.headers.get("authorization") === `Bearer ${secret}` ||
    url.searchParams.get("secret") === secret
  );
}

export async function GET(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return sync();
}

export async function POST(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return sync();
}

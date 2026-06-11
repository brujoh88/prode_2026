import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MatchList } from "@/components/MatchList";
import type { Match, Prediction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PartidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [perfilRes, matchesRes, predictionsRes] = await Promise.all([
    supabase.from("profiles").select("name_set").eq("id", user.id).single(),
    supabase.from("matches").select("*").order("utc_kickoff", { ascending: true }),
    supabase.from("predictions").select("*").eq("user_id", user.id),
  ]);

  // Primera vez: que elija su apodo antes de entrar a la cancha
  if (perfilRes.data && !perfilRes.data.name_set) redirect("/apodo");

  const matches = (matchesRes.data ?? []) as Match[];
  const predictions = (predictionsRes.data ?? []) as Prediction[];

  if (!matches.length) {
    return (
      <main className="mx-auto max-w-3xl p-6 text-center">
        <h1 className="text-xl font-black">Todavía no hay partidos cargados</h1>
        <p className="mt-2 text-sm opacity-70">
          Falta correr la sincronización con football-data.org — fijate{" "}
          <code className="rounded bg-celeste-claro px-1">/api/sync</code> en el
          README.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-4">
      <h1 className="mb-1 text-2xl font-black">Los partidos</h1>
      <p className="mb-5 text-sm opacity-70">
        3 puntos si la clavás justo · 1 si acertás quién gana · Cierra cuando
        arranca el partido, después no vale llorar.
      </p>
      <MatchList matches={matches} predictions={predictions} userId={user.id} />
    </main>
  );
}

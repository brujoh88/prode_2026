import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KnockoutView } from "@/components/KnockoutView";
import type { Match, Prediction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LlavesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [matchesRes, predictionsRes] = await Promise.all([
    supabase.from("matches").select("*").order("utc_kickoff", { ascending: true }),
    supabase.from("predictions").select("*").eq("user_id", user.id),
  ]);

  const matches = (matchesRes.data ?? []) as Match[];
  const predictions = (predictionsRes.data ?? []) as Prediction[];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-4">
      <h1 className="mb-1 text-2xl font-black">Las llaves</h1>
      <p className="mb-5 text-sm opacity-70">
        El camino a la gloria. Pronosticá cada cruce de la fase eliminatoria.
      </p>
      <KnockoutView matches={matches} predictions={predictions} userId={user.id} />
    </main>
  );
}

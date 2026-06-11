import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LeaderboardRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const MEDALLAS = ["🥇", "🥈", "🥉"];

export default async function TablaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("leaderboard")
    .select("*")
    .order("total_points", { ascending: false })
    .order("exactos", { ascending: false });
  const filas = (data ?? []) as LeaderboardRow[];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-4">
      <h1 className="mb-1 text-2xl font-black">La tabla</h1>
      <p className="mb-5 text-sm opacity-70">
        Acá no hay VAR que te salve: el que más la clava, arriba.
      </p>

      <div className="overflow-x-auto rounded-xl border border-borde bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borde bg-celeste-claro text-left text-xs font-bold uppercase tracking-wide text-celeste-profundo dark:text-celeste">
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">Jugador</th>
              <th className="px-3 py-2.5 text-right">Exactos</th>
              <th className="px-3 py-2.5 text-right">Pálpitos</th>
              <th className="px-3 py-2.5 text-right">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, i) => (
              <tr
                key={fila.user_id}
                className={`border-b border-borde/50 last:border-0 ${
                  fila.user_id === user.id
                    ? "bg-celeste/15 font-semibold"
                    : ""
                }`}
              >
                <td className="px-3 py-2.5">{MEDALLAS[i] ?? i + 1}</td>
                <td className="px-3 py-2.5">
                  {fila.display_name}
                  {fila.user_id === user.id && (
                    <span className="ml-1 text-xs opacity-60">(vos)</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right">{fila.exactos}</td>
                <td className="px-3 py-2.5 text-right">{fila.signos}</td>
                <td className="px-3 py-2.5 text-right font-black text-dorado-oscuro dark:text-dorado">
                  {fila.total_points}
                </td>
              </tr>
            ))}
            {!filas.length && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center opacity-60">
                  Acá no jugó nadie todavía. Invitá a los pibes. 🧉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

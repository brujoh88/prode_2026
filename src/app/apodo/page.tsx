import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApodoForm } from "@/components/ApodoForm";

export const dynamic = "force-dynamic";

export default async function ApodoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("display_name, name_set")
    .eq("id", user.id)
    .single();

  return (
    <ApodoForm
      userId={user.id}
      apodoActual={perfil?.display_name ?? ""}
      esPrimeraVez={!perfil?.name_set}
    />
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const [saliendo, setSaliendo] = useState(false);
  const router = useRouter();

  async function salir() {
    if (saliendo) return;
    setSaliendo(true);
    // Fade-out de toda la página antes de irse
    document.body.style.transition = "opacity 0.35s ease";
    document.body.style.opacity = "0";
    await Promise.all([
      createClient().auth.signOut(),
      new Promise((r) => setTimeout(r, 350)),
    ]);
    router.push("/login");
    router.refresh();
    setTimeout(() => {
      document.body.style.opacity = "1";
    }, 100);
  }

  return (
    <button
      onClick={salir}
      disabled={saliendo}
      className="min-h-11 text-sm font-medium opacity-80 hover:opacity-100 hover:underline"
    >
      {saliendo ? "👋" : "Me voy"}
    </button>
  );
}

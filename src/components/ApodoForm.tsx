"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function ApodoForm({
  userId,
  apodoActual,
  esPrimeraVez,
}: {
  userId: string;
  apodoActual: string;
  esPrimeraVez: boolean;
}) {
  const [apodo, setApodo] = useState(esPrimeraVez ? "" : apodoActual);
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();

  const valido = apodo.trim().length >= 3 && apodo.trim().length <= 20;

  async function guardar() {
    if (!valido || guardando) return;
    setGuardando(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: apodo.trim(), name_set: true })
      .eq("id", userId);
    setGuardando(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("Ese apodo ya lo agarró otro. Probá con una variante 😅");
      } else {
        toast.error("Uy, no se guardó. Probá de nuevo.");
      }
      return;
    }
    toast.success(`Listo, ${apodo.trim()} 🤝`);
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          className="mb-3 text-5xl"
        >
          🎽
        </motion.div>
        <h1 className="text-2xl font-black">
          {esPrimeraVez ? "¿Cómo te conocen los pibes?" : "Cambiá tu apodo"}
        </h1>
        <p className="mt-2 text-sm opacity-70">
          {esPrimeraVez
            ? "Elegí el nombre que va a aparecer en la tabla. Después lo podés cambiar."
            : "Este es el nombre que ven todos en la tabla."}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.15 }}
        className="flex flex-col gap-3"
      >
        <input
          type="text"
          value={apodo}
          onChange={(e) => setApodo(e.target.value.slice(0, 20))}
          onKeyDown={(e) => e.key === "Enter" && guardar()}
          placeholder="El Pipa, Tía Marta, Chiqui…"
          autoFocus
          className="h-12 rounded-lg border border-borde bg-card px-4 text-center text-lg font-semibold outline-none transition-colors focus:border-celeste-oscuro focus:ring-2 focus:ring-celeste/40"
          aria-label="Tu apodo"
        />
        <p
          className={`text-center text-xs transition-opacity ${
            apodo.length > 0 && !valido ? "text-red-500 opacity-100" : "opacity-50"
          }`}
        >
          {apodo.length > 0 && !valido
            ? "Tiene que tener entre 3 y 20 letras."
            : "Entre 3 y 20 letras · tiene que ser único, no lo puede tener otro."}
        </p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={guardar}
          disabled={!valido || guardando}
          className="h-12 rounded-lg bg-celeste-oscuro font-bold text-white transition-colors hover:bg-celeste-profundo disabled:cursor-not-allowed disabled:opacity-40"
        >
          {guardando ? "Guardando…" : esPrimeraVez ? "¡A la cancha!" : "Guardar"}
        </motion.button>
      </motion.div>
    </main>
  );
}

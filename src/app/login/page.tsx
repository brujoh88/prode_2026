"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<
    "idle" | "enviando" | "enviado" | "confirmar" | "error"
  >("idle");
  const searchParams = useSearchParams();
  const errorAuth = searchParams.get("error");

  // Primero intenta sin crear usuario: si el email ya existe le llega el link.
  // Si no existe, pide confirmación antes de crear la cuenta — así un typo
  // no genera un usuario fantasma.
  async function enviarMagicLink(crearCuenta: boolean) {
    setEstado("enviando");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
        shouldCreateUser: crearCuenta,
      },
    });
    if (!error) {
      setEstado("enviado");
    } else if (!crearCuenta && error.code === "otp_disabled") {
      setEstado("confirmar");
    } else {
      setEstado("error");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 p-6">
      <div className="text-center">
        <motion.div
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.1 }}
          className="mb-2 text-6xl"
        >
          ⚽
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.2 }}
          className="text-3xl font-black tracking-tight"
        >
          Prode Mundial 2026
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.3 }}
          className="mt-2 text-sm opacity-70"
        >
          Entrá con tu mail y listo, sin contraseña.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.4 }}
      >
        {estado === "enviado" ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-center"
          >
            📬 ¡Va en camino! Fijate en tu casilla <strong>{email}</strong> y
            tocá el link. Si no aparece, revisá spam — no te quedes afuera.
          </motion.div>
        ) : estado === "confirmar" ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-center"
          >
            <p>
              🤔 <strong>{email}</strong> no está registrado. Revisá que esté
              bien escrito. ¿Creamos una cuenta nueva con ese mail?
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => enviarMagicLink(true)}
              className="h-12 rounded-lg bg-celeste-oscuro font-bold text-white transition-colors hover:bg-celeste-profundo"
            >
              Sí, crear mi cuenta
            </motion.button>
            <button
              onClick={() => setEstado("idle")}
              className="h-12 rounded-lg border border-borde font-bold transition-colors hover:bg-card"
            >
              Corregir el email
            </button>
          </motion.div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviarMagicLink(false);
            }}
            className="flex flex-col gap-3"
          >
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-lg border border-borde bg-card px-4 outline-none transition-colors focus:border-celeste-oscuro focus:ring-2 focus:ring-celeste/40"
            />
            <motion.button
              type="submit"
              whileTap={{ scale: 0.96 }}
              disabled={estado === "enviando"}
              className="h-12 rounded-lg bg-celeste-oscuro font-bold text-white transition-colors hover:bg-celeste-profundo disabled:opacity-50"
            >
              {estado === "enviando" ? "Enviando…" : "Mandame el link"}
            </motion.button>
            {(estado === "error" || errorAuth) && (
              <p className="text-center text-sm text-red-500">
                Uy, algo se rompió. Probá de nuevo.
              </p>
            )}
          </form>
        )}
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

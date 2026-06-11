import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import type { LeaderboardRow } from "@/lib/types";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prode Mundial 2026",
  description: "Pronosticá los partidos del Mundial con tu grupo",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let apodo: string | null = null;
  let puntos = 0;
  let posicion: number | null = null;

  if (user) {
    const { data } = await supabase
      .from("leaderboard")
      .select("*")
      .order("total_points", { ascending: false })
      .order("exactos", { ascending: false });
    const filas = (data ?? []) as LeaderboardRow[];
    const i = filas.findIndex((f) => f.user_id === user.id);
    if (i >= 0) {
      apodo = filas[i].display_name;
      puntos = filas[i].total_points;
      posicion = i + 1;
    }
  }

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {user && <Header apodo={apodo} puntos={puntos} posicion={posicion} />}
        {children}
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}

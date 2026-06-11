"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";

function SolDeMayo() {
  // Sol de mayo simplificado: disco con rayos rectos y ondulados alternados
  const rayos = Array.from({ length: 16 });
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-6 w-6 shrink-0 text-dorado drop-shadow-sm"
      aria-hidden="true"
    >
      <g fill="currentColor">
        {rayos.map((_, i) => (
          <rect
            key={i}
            x="48.5"
            y="2"
            width="3"
            height="24"
            rx="1.2"
            transform={`rotate(${i * 22.5} 50 50)`}
          />
        ))}
        <circle cx="50" cy="50" r="20" />
        <circle cx="50" cy="50" r="20" fill="none" stroke="#d99e1b" strokeWidth="2" />
      </g>
    </svg>
  );
}

const LINKS = [
  { href: "/", label: "Partidos" },
  { href: "/grupos", label: "Grupos" },
  { href: "/tabla", label: "Tabla" },
];

export function Header({
  apodo,
  puntos,
  posicion,
}: {
  apodo: string | null;
  puntos: number;
  posicion: number | null;
}) {
  const [scrolleado, setScrolleado] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolleado(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-20 bg-celeste/85 text-white backdrop-blur-md transition-all duration-300 ${
        scrolleado ? "shadow-lg" : "shadow-md"
      }`}
    >
      <nav
        className={`mx-auto flex max-w-3xl items-center gap-3 px-3 transition-all duration-300 sm:gap-5 sm:px-4 ${
          scrolleado ? "py-1.5" : "py-2.5"
        }`}
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 text-base font-black tracking-tight sm:text-lg"
        >
          <SolDeMayo />
          <span>Prode 2026</span>
          <span className="text-[10px] tracking-widest text-dorado" aria-label="tres estrellas">
            ★★★
          </span>
        </Link>

        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`min-h-11 content-center text-sm font-medium hover:underline ${
              pathname === l.href ? "underline underline-offset-4" : ""
            }`}
          >
            {l.label}
          </Link>
        ))}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {posicion !== null && (
            <Link
              href="/tabla"
              className="rounded-full bg-dorado px-2.5 py-1 text-xs font-bold text-celeste-profundo shadow-sm"
              title="Tus puntos y tu posición"
            >
              ⭐ {puntos} pts · {posicion}°
            </Link>
          )}
          {apodo && (
            <Link
              href="/apodo"
              className="hidden max-w-28 truncate text-sm font-semibold hover:underline sm:inline"
              title="Cambiá tu apodo"
            >
              {apodo}
            </Link>
          )}
          <LogoutButton />
        </div>
      </nav>
    </header>
  );
}

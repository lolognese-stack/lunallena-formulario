"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Icono } from "@/components/ui/Icono";
import { BASE } from "@/lib/contacto";

/** Pantalla "Armando tu viaje…": describe lo que hace el motor, sin prometer IA. */
export function Armando({ titulo, pasos }: { titulo: string; pasos: string[] }) {
  const [hechos, setHechos] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setHechos((n) => Math.min(n + 1, pasos.length)), 420);
    return () => clearInterval(id);
  }, [pasos.length]);

  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[100] grid place-items-center bg-bg/96 p-6 backdrop-blur-sm">
      <div className="grid w-full max-w-[360px] justify-items-center gap-6 text-center">
        <Image src={`${BASE}/logo.svg`} alt="" width={72} height={72} className="animate-pulse rounded-[18px]" priority />
        <h2 className="text-[1.6rem]">{titulo}</h2>
        <ul className="grid w-full gap-3 text-left">
          {pasos.map((paso, i) => (
            <li key={paso} className={`flex items-center gap-3 transition-opacity duration-300 ${i <= hechos ? "opacity-100" : "opacity-35"}`}>
              <span className={`grid size-6 shrink-0 place-items-center rounded-full ${i < hechos ? "bg-gold text-white" : "border-2 border-line"}`}>
                {i < hechos && <Icono nombre="check" className="size-3.5" />}
              </span>
              <span className="font-medium">{paso}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Espera mínima para que la pantalla "Armando…" se lea, aunque el servidor responda antes. */
export const ESPERA_MINIMA_MS = 1800;
export const conEsperaMinima = async <T,>(promesa: Promise<T>): Promise<T> =>
  (await Promise.all([promesa, new Promise((r) => setTimeout(r, ESPERA_MINIMA_MS))]))[0];

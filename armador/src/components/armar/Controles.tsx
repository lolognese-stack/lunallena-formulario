"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "@/components/ui/Icono";
import { MESES_DE_LLUVIA } from "@/lib/motor/config";
import type { CategoriaHotel, Estilo } from "@/lib/motor";

/** Tarjeta elegible (meses, estilos, hoteles): se marca con `aria-pressed`. */
export const claseOpcion =
  "cursor-pointer rounded-card border-[1.5px] border-line bg-white text-left transition-[border-color,background,box-shadow] hover:border-[#cfc6be] aria-pressed:border-orange aria-pressed:bg-orange-soft aria-pressed:shadow-[0_0_0_1px_var(--color-orange)]";

export const HOTELES: CategoriaHotel[] = ["economico", "estandar", "superior"];

export const ESTILOS: { valor: Estilo; icono: NombreIcono }[] = [
  { valor: "clasico", icono: "building" },
  { valor: "aventura", icono: "mountain" },
  { valor: "mistico", icono: "chispa" },
  { valor: "relax", icono: "bed" },
];

export function Contador({ valor, min, max, onCambio, menos, mas, children }: { valor: number; min: number; max: number; onCambio: (n: number) => void; menos: string; mas: string; children: ReactNode }) {
  const boton = "grid size-14 cursor-pointer place-items-center rounded-full border-[1.5px] border-line bg-white text-[1.6rem] text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:text-[#c9c2bb] disabled:hover:border-line";
  return (
    <div className="flex items-center gap-5">
      <button type="button" className={boton} aria-label={menos} disabled={valor <= min} onClick={() => onCambio(valor - 1)}>
        −
      </button>
      <output aria-live="polite" className="min-w-[5ch] text-center">
        {children}
      </output>
      <button type="button" className={boton} aria-label={mas} disabled={valor >= max} onClick={() => onCambio(valor + 1)}>
        +
      </button>
    </div>
  );
}

/** Los 12 meses en tarjetas, con la marca de temporada de lluvias. */
export function SelectorMes({ mes, onCambio }: { mes: number | null; onCambio: (mes: number) => void }) {
  const t = useTranslations("armar.dias");
  const meses = useTranslations("comun").raw("meses") as string[];
  return (
    <div className="grid grid-cols-3 gap-2 min-[560px]:grid-cols-4 min-[800px]:grid-cols-6">
      {meses.map((nombre, i) => (
        <button key={nombre} type="button" aria-pressed={mes === i + 1} onClick={() => onCambio(i + 1)} className={`${claseOpcion} grid min-h-14 place-items-center px-2 py-2.5 text-center`}>
          <span className="font-semibold">{nombre}</span>
          {MESES_DE_LLUVIA.includes(i + 1) && <small className="text-[0.72rem] text-muted">{t("lluvias")}</small>}
        </button>
      ))}
    </div>
  );
}

export function SelectorHotel({ hotel, onCambio }: { hotel: CategoriaHotel; onCambio: (h: CategoriaHotel) => void }) {
  const tc = useTranslations("comun");
  return (
    <div className="grid gap-3 min-[700px]:grid-cols-3">
      {HOTELES.map((h) => (
        <button key={h} type="button" aria-pressed={hotel === h} onClick={() => onCambio(h)} className={`${claseOpcion} grid gap-1 p-4`}>
          <b className="font-head">{tc(`hoteles.${h}.nombre`)}</b>
          <small className="text-[0.88rem] text-muted">{tc(`hoteles.${h}.texto`)}</small>
        </button>
      ))}
    </div>
  );
}

export function SelectorEstilo({ estilo, onCambio }: { estilo: Estilo | null; onCambio: (e: Estilo) => void }) {
  const tc = useTranslations("comun");
  return (
    <div className="grid gap-3 min-[560px]:grid-cols-2">
      {ESTILOS.map(({ valor, icono }) => (
        <button key={valor} type="button" aria-pressed={estilo === valor} onClick={() => onCambio(valor)} className={`${claseOpcion} flex items-center gap-4 p-4`}>
          <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-orange-soft text-orange-ink">
            <Icono nombre={icono} className="size-6" />
          </span>
          <span className="grid gap-0.5">
            <b className="font-head text-[1.05rem]">{tc(`estilos.${valor}.nombre`)}</b>
            <small className="text-[0.88rem] text-muted">{tc(`estilos.${valor}.texto`)}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

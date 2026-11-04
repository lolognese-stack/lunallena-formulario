"use client";

import type { ReactNode, RefObject } from "react";

/** Botón elegible (chips, tarjetas): se marca con `aria-pressed`. */
export const claseOpcion =
  "cursor-pointer rounded-card border-[1.5px] border-line bg-card text-left transition-[border-color,background,box-shadow] duration-150 hover:border-[#cfc6be] aria-pressed:border-gold aria-pressed:bg-orange-soft aria-pressed:shadow-[0_0_0_1px_var(--color-gold)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export function Encabezado({ titulo, lead, refTitulo }: { titulo: string; lead?: string; refTitulo?: RefObject<HTMLHeadingElement | null> }) {
  return (
    <div className="grid gap-2.5">
      <h1 ref={refTitulo} tabIndex={-1} className="text-[clamp(1.8rem,7vw,2.8rem)] outline-none">
        {titulo}
      </h1>
      {lead && <p className="lead text-[1rem] min-[600px]:text-[1.1rem]">{lead}</p>}
    </div>
  );
}

/** Opciones de una sola elección. Al tocar, avisa con `onElegir` (el quiz decide si avanza). */
export function Chips<T extends string | number>({
  valores,
  elegido,
  onElegir,
  etiqueta,
  columnas = "grid-cols-2 min-[600px]:grid-cols-3",
  nombre,
}: {
  valores: readonly T[];
  elegido: T | null | undefined;
  onElegir: (v: T) => void;
  etiqueta: (v: T) => ReactNode;
  columnas?: string;
  nombre: string;
}) {
  return (
    <div role="group" aria-label={nombre} className={`grid gap-2.5 ${columnas}`}>
      {valores.map((v) => (
        <button key={String(v)} type="button" aria-pressed={elegido === v} onClick={() => onElegir(v)} className={`${claseOpcion} min-h-14 px-4 py-3 text-[1rem] font-semibold`}>
          {etiqueta(v)}
        </button>
      ))}
    </div>
  );
}

export function Progreso({ paso, total, texto }: { paso: number; total: number; texto: string }) {
  return (
    <div className="grid gap-2">
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={paso}
        aria-valuetext={texto}
        className="h-1 overflow-hidden bg-line"
      >
        <div className="h-full bg-gold transition-[width] duration-300 ease-marca" style={{ width: `${(paso / total) * 100}%` }} />
      </div>
      <span className="text-[0.78rem] font-medium tracking-[0.18em] text-muted uppercase">{texto}</span>
    </div>
  );
}

export function Campo({
  etiqueta,
  valor,
  onCambio,
  tipo = "text",
  autoComplete,
  inputMode,
  error,
  id,
}: {
  etiqueta: string;
  valor: string;
  onCambio: (v: string) => void;
  tipo?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel";
  error?: string | null;
  id: string;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[0.92rem] font-semibold">
        {etiqueta}
      </label>
      <input
        id={id}
        type={tipo}
        value={valor}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(e) => onCambio(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-13 rounded-sm border-[1.5px] border-line bg-card px-4 text-[1rem] outline-none focus:border-gold aria-invalid:border-error"
      />
      {error && (
        <span id={`${id}-error`} className="text-[0.85rem] text-error">
          {error}
        </span>
      )}
    </div>
  );
}

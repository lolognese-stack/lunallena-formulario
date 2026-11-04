"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Icono } from "@/components/ui/Icono";
import { soles } from "@/lib/formato";

export interface DestinoCarga {
  id: string;
  nombre: string;
}

export interface ExperienciaCarga {
  id: string;
  nombre: string;
  destinoId: string;
  dias: number;
  precioDesde: number;
  terminaEnId: string | null;
}

/** Qué hace el cliente en un bloque. `experiencia` con id null: está buscando en el catálogo. */
export type Contenido = { tipo: "vacio" } | { tipo: "experiencia"; id: string | null } | { tipo: "texto"; texto: string } | { tipo: "libre" };

/** Un bloque del constructor: un día, o varios si la experiencia dura más de uno. */
export interface Bloque {
  clave: string;
  destinoId: string;
  contenido: Contenido;
}

const MAX_RESULTADOS = 8;
const normalizar = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const claseSegmento =
  "cursor-pointer rounded-full border-[1.5px] border-line bg-white px-3 py-2 text-[0.86rem] font-semibold transition-colors hover:border-[#cfc6be] aria-pressed:border-orange aria-pressed:bg-orange-soft";
const claseCampo =
  "w-full rounded-sm border-[1.5px] border-line bg-white px-3.5 py-3 text-[1rem] text-ink outline-offset-2 placeholder:text-[#8a8a8a] focus:border-ink";

export function DiaEditor({
  bloque,
  desde,
  hasta,
  cupo,
  destinos,
  experiencias,
  onCambio,
  onQuitar,
}: {
  bloque: Bloque;
  desde: number;
  hasta: number;
  /** Días que puede ocupar este bloque sin pasar el máximo del viaje. */
  cupo: number;
  destinos: DestinoCarga[];
  experiencias: ExperienciaCarga[];
  onCambio: (b: Bloque) => void;
  onQuitar: (() => void) | null;
}) {
  const t = useTranslations("cargar.dia");
  const id = useId();
  const { contenido } = bloque;
  const nombreDestino = (destinoId: string) => destinos.find((d) => d.id === destinoId)?.nombre ?? "";
  const elegida = contenido.tipo === "experiencia" && contenido.id ? experiencias.find((e) => e.id === contenido.id) : undefined;
  const titulo = desde === hasta ? t("uno", { n: desde }) : t("varios", { desde, hasta });

  const cambiarDestino = (destinoId: string) => {
    const sigue = elegida && elegida.destinoId === destinoId;
    onCambio({ ...bloque, destinoId, contenido: contenido.tipo === "experiencia" && !sigue ? { tipo: "experiencia", id: null } : contenido });
  };

  const opciones = [
    { tipo: "experiencia", etiqueta: t("opciones.experiencia"), nuevo: { tipo: "experiencia", id: null } },
    { tipo: "texto", etiqueta: t("opciones.texto"), nuevo: { tipo: "texto", texto: "" } },
    { tipo: "libre", etiqueta: t("opciones.libre"), nuevo: { tipo: "libre" } },
  ] as const;

  return (
    <li className="grid gap-4 rounded-panel border border-line bg-white p-[clamp(16px,3vw,24px)] shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 text-[1.1rem]">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-orange font-head text-[0.82rem] font-extrabold">
            {desde}
          </span>
          {titulo}
        </h3>
        {onQuitar && (
          <button type="button" onClick={onQuitar} aria-label={t("quitar", { n: desde })} className="grid size-10 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-sand hover:text-error">
            <Icono nombre="trash" className="size-[18px]" />
          </button>
        )}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor={`${id}-destino`} className="text-[0.88rem] font-semibold">
          {t("destino")}
        </label>
        <select id={`${id}-destino`} value={bloque.destinoId} onChange={(e) => cambiarDestino(e.target.value)} className={`${claseCampo} cursor-pointer`}>
          {destinos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-2 text-[0.88rem] font-semibold">{t("pregunta")}</legend>
        <div className="flex flex-wrap gap-1.5">
          {opciones.map((o) => (
            <button key={o.tipo} type="button" aria-pressed={contenido.tipo === o.tipo} onClick={() => contenido.tipo !== o.tipo && onCambio({ ...bloque, contenido: o.nuevo })} className={claseSegmento}>
              {o.etiqueta}
            </button>
          ))}
        </div>

        {contenido.tipo === "vacio" && <p className="text-[0.9rem] text-muted">{t("vacio")}</p>}
        {contenido.tipo === "libre" && <p className="text-[0.9rem] text-muted">{t("libre")}</p>}

        {contenido.tipo === "texto" && (
          <div className="grid gap-1.5">
            <label htmlFor={`${id}-texto`} className="sr-only">
              {t("texto")}
            </label>
            <textarea
              id={`${id}-texto`}
              value={contenido.texto}
              maxLength={200}
              rows={2}
              placeholder={t("textoAyuda")}
              onChange={(e) => onCambio({ ...bloque, contenido: { tipo: "texto", texto: e.target.value } })}
              className={`${claseCampo} resize-y`}
            />
          </div>
        )}

        {elegida && (
          <div className="flex items-center justify-between gap-3 rounded-card border-[1.5px] border-orange bg-orange-soft p-3.5">
            <div className="grid gap-0.5">
              <b className="font-head">{elegida.nombre}</b>
              <small className="text-[0.86rem] text-ink-2">
                {t("dias", { n: elegida.dias })} · {t("desde", { precio: soles.format(elegida.precioDesde) })}
              </small>
            </div>
            <button type="button" onClick={() => onCambio({ ...bloque, contenido: { tipo: "experiencia", id: null } })} className="cursor-pointer rounded-full px-3 py-2 text-[0.88rem] font-semibold text-orange-ink underline-offset-2 hover:underline">
              {t("cambiar")}
            </button>
          </div>
        )}

        {contenido.tipo === "experiencia" && !elegida && (
          <Buscador
            destinoId={bloque.destinoId}
            cupo={cupo}
            experiencias={experiencias}
            nombreDestino={nombreDestino}
            onElegir={(e) => onCambio({ ...bloque, destinoId: e.destinoId, contenido: { tipo: "experiencia", id: e.id } })}
          />
        )}
      </fieldset>
    </li>
  );
}

function Buscador({
  destinoId,
  cupo,
  experiencias,
  nombreDestino,
  onElegir,
}: {
  destinoId: string;
  cupo: number;
  experiencias: ExperienciaCarga[];
  nombreDestino: (id: string) => string;
  onElegir: (e: ExperienciaCarga) => void;
}) {
  const t = useTranslations("cargar.dia");
  const id = useId();
  const [consulta, setConsulta] = useState("");
  const q = normalizar(consulta.trim());
  const palabras = q.split(/\s+/).filter(Boolean);

  // Sin texto: las del destino elegido. Con texto: busca en todo el catálogo, también por
  // destino; cada palabra tiene que aparecer, en cualquier orden ("tren machu").
  const lista = q
    ? experiencias
        .filter((e) => {
          const texto = normalizar(`${e.nombre} ${nombreDestino(e.destinoId)}`);
          return palabras.every((p) => texto.includes(p));
        })
        .slice(0, MAX_RESULTADOS)
    : experiencias.filter((e) => e.destinoId === destinoId);

  return (
    <div className="grid gap-2.5">
      <label htmlFor={`${id}-q`} className="text-[0.88rem] font-semibold">
        {t("buscar")}
      </label>
      <div className="relative">
        <Icono nombre="search" className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted" />
        <input
          id={`${id}-q`}
          type="search"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder={t("buscarAyuda")}
          autoComplete="off"
          className={`${claseCampo} pl-10`}
        />
      </div>
      <p className="text-[0.82rem] font-semibold text-muted" aria-live="polite">
        {q ? t("resultados", { n: lista.length }) : t("deDestino", { destino: nombreDestino(destinoId) })}
      </p>
      {lista.length > 0 ? (
        <ul className="grid max-h-[340px] gap-2 overflow-y-auto overscroll-contain pr-1">
          {lista.map((e) => {
            const noEntra = e.dias > cupo;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  disabled={noEntra}
                  onClick={() => onElegir(e)}
                  className="grid w-full cursor-pointer gap-0.5 rounded-card border-[1.5px] border-line bg-white px-3.5 py-3 text-left transition-colors hover:border-orange disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-line"
                >
                  <b className="font-head text-[0.98rem]">{e.nombre}</b>
                  <small className="text-[0.84rem] text-muted">
                    {q && `${nombreDestino(e.destinoId)} · `}
                    {t("dias", { n: e.dias })} · {noEntra ? t("noEntra") : t("desde", { precio: soles.format(e.precioDesde) })}
                  </small>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[0.9rem] text-muted">{t("sinResultados")}</p>
      )}
    </div>
  );
}

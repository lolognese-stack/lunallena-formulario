"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { claseOpcion, Contador, SelectorEstilo } from "@/components/armar/Controles";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { MAX_DIAS_VIAJE } from "@/lib/datos/carga";
import type { Estilo } from "@/lib/motor";
import type { DestinoCarga } from "./DiaEditor";

export interface PedidoCompletar {
  dias: number;
  estilo: Estilo;
  destinos: string[];
}

/** Pide días totales, estilo y, si quiere, destinos nuevos. Usa <dialog> nativo: foco atrapado y Esc. */
export function DialogoCompletar({
  abierto,
  cargados,
  hayVacios,
  destinos,
  onCerrar,
  onCompletar,
}: {
  abierto: boolean;
  cargados: number;
  hayVacios: boolean;
  /** Destinos que se ofrecen y el cliente todavía no cargó. */
  destinos: DestinoCarga[];
  onCerrar: () => void;
  onCompletar: (p: PedidoCompletar) => void;
}) {
  const t = useTranslations("cargar.completar");
  const ta = useTranslations("armar.dias");
  const dialogo = useRef<HTMLDialogElement>(null);
  const minimo = Math.min(MAX_DIAS_VIAJE, Math.max(3, cargados));
  const [dias, setDias] = useState(minimo);
  const [estilo, setEstilo] = useState<Estilo | null>(null);
  const [elegidos, setElegidos] = useState<string[]>([]);
  const sinLugar = cargados >= MAX_DIAS_VIAJE && !hayVacios;

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  // Al abrir, propone unos días más de los cargados (sin pasar el máximo).
  const [abiertoAntes, setAbiertoAntes] = useState(false);
  if (abierto !== abiertoAntes) {
    setAbiertoAntes(abierto);
    if (abierto) setDias(Math.min(MAX_DIAS_VIAJE, Math.max(minimo, cargados + 3)));
  }
  const diasValidos = Math.max(dias, minimo);

  const alternar = (id: string) => setElegidos((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  return (
    <dialog
      ref={dialogo}
      onClose={onCerrar}
      aria-labelledby="completar-titulo"
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-panel bg-card p-0 text-ink backdrop:bg-ink/55 min-[700px]:m-auto min-[700px]:max-w-[640px] min-[700px]:rounded-panel"
    >
      <div className="flex max-h-[92dvh] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-line px-[clamp(18px,4vw,28px)] pt-5 pb-4">
          <div className="grid gap-1.5">
            <h2 id="completar-titulo" className="text-[1.45rem]">
              {t("titulo")}
            </h2>
            <p className="text-[0.94rem] text-muted">{t("lead", { n: cargados })}</p>
          </div>
          <button type="button" onClick={onCerrar} aria-label={t("cerrar")} className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-sand">
            <Icono nombre="x" />
          </button>
        </div>

        <div className="grid gap-7 overflow-y-auto px-[clamp(18px,4vw,28px)] py-6">
          {sinLugar ? (
            <p className="text-ink-2">{t("sinLugar")}</p>
          ) : (
            <>
              <section className="grid gap-3">
                <h3 className="text-[1.05rem]">{t("dias")}</h3>
                <Contador valor={diasValidos} min={minimo} max={MAX_DIAS_VIAJE} onCambio={setDias} menos={ta("menos")} mas={ta("mas")}>
                  <b className="block font-head text-[2.4rem] leading-none font-light">{diasValidos}</b>
                  <span className="text-[0.9rem] text-muted">{ta("unidad", { n: diasValidos })}</span>
                </Contador>
              </section>
              <section className="grid gap-3">
                <h3 className="text-[1.05rem]">{t("estilo")}</h3>
                <SelectorEstilo estilo={estilo} onCambio={setEstilo} />
              </section>
              {destinos.length > 0 && (
                <section className="grid gap-3">
                  <div className="grid gap-1">
                    <h3 className="text-[1.05rem]">{t("destinos")}</h3>
                    <p className="text-[0.9rem] text-muted">{t("destinosAyuda")}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {destinos.map((d) => (
                      <button key={d.id} type="button" aria-pressed={elegidos.includes(d.id)} onClick={() => alternar(d.id)} className={`${claseOpcion} rounded-full px-4 py-2.5 text-[0.92rem] font-semibold`}>
                        {d.nombre}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <div className="border-t border-line px-[clamp(18px,4vw,28px)] py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <Boton bloque disabled={sinLugar || !estilo} onClick={() => estilo && onCompletar({ dias: diasValidos, estilo, destinos: elegidos })}>
            {t("boton")} <Icono nombre="arrow" />
          </Boton>
        </div>
      </div>
    </dialog>
  );
}

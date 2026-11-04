"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { VistaPrevia as Vista } from "@/lib/leads/vista-previa";

/** Paso 8: primeros días con detalle; el resto, borroso (el detalle no llega al navegador). */
export function VistaPrevia({ vista }: { vista: Vista }) {
  const t = useTranslations("quiz.datos");
  const visibles = vista.dias.filter((d) => d.visible);
  const ocultos = vista.dias.filter((d) => !d.visible);

  const titulo = (d: Vista["dias"][number]) => {
    const tipo = d.tipo ?? "experiencia";
    if (tipo === "experiencia" && !d.experiencia) return d.destino;
    return t(`tipos.${tipo}`, { destino: d.destino, experiencia: d.experiencia ?? d.destino });
  };

  return (
    <div className="grid gap-3">
      <p className="text-[0.92rem] text-muted">
        {t("ruta", { ruta: vista.ruta.join(" · ") })}
        {vista.precioDesdeUsd ? <> · <b className="font-semibold text-ink">{t("precio", { precio: Math.round(vista.precioDesdeUsd).toLocaleString("es-PE") })}</b></> : null}
      </p>
      <ol className="grid gap-2.5">
        {visibles.map((d) => (
          <li key={d.numero} className="tarjeta-pkg grid grid-cols-[72px_1fr] items-center gap-3.5 overflow-hidden p-2.5 pr-4 min-[600px]:grid-cols-[96px_1fr]">
            <div className="relative aspect-square overflow-hidden rounded-sm bg-sand">
              {d.imagenUrl && <Image src={d.imagenUrl} alt="" fill sizes="96px" className="object-cover" />}
            </div>
            <div className="grid gap-0.5">
              <span className="text-[0.72rem] font-medium tracking-[0.2em] text-orange-ink uppercase">
                {t("dia", { n: d.numero })} · {d.destino}
              </span>
              <b className="font-head text-[1.05rem] leading-snug font-medium">{titulo(d)}</b>
            </div>
          </li>
        ))}
        {ocultos.length > 0 && (
          <li className="relative overflow-hidden" aria-label={t("bloqueado", { n: ocultos.length })}>
            <div aria-hidden="true" className="pointer-events-none grid gap-2.5 blur-[5px] select-none">
              {ocultos.slice(0, 3).map((d) => (
                <div key={d.numero} className="tarjeta-pkg grid grid-cols-[72px_1fr] items-center gap-3.5 p-2.5 pr-4 min-[600px]:grid-cols-[96px_1fr]">
                  <div className="aspect-square rounded-sm bg-[linear-gradient(135deg,#d9c9a8,#efe8de)]" />
                  <div className="grid gap-1.5">
                    <span className="text-[0.72rem] tracking-[0.2em] text-orange-ink uppercase">
                      {t("dia", { n: d.numero })} · {d.destino}
                    </span>
                    <span className="h-3.5 w-3/4 rounded-sm bg-[#d9cdb9]" />
                    <span className="h-3 w-1/2 rounded-sm bg-[#e4dacb]" />
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(180deg,rgba(245,238,221,0)_0%,rgba(245,238,221,.85)_70%)]">
              <span className="border border-line bg-card px-4 py-2 text-[0.88rem] font-semibold">{t("bloqueado", { n: ocultos.length })}</span>
            </div>
          </li>
        )}
      </ol>
    </div>
  );
}

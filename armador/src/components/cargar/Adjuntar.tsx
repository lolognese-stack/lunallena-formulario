"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { prepararAdjunto } from "@/app/cargar/acciones";
import { Icono } from "@/components/ui/Icono";
import { esTipoAdjunto, MAX_BYTES_ADJUNTO, TIPOS_ADJUNTO, type Adjunto } from "@/lib/datos/adjunto";

export type EstadoAdjunto =
  | { estado: "listo"; adjunto: Adjunto }
  | { estado: "subiendo"; nombre: string; pct: number }
  | { estado: "error"; mensaje: "errorTipo" | "errorTamano" | "errorSubida" }
  | null;

/** Sube el archivo directo al bucket privado con un permiso de un solo uso que da el servidor. */
function subir(url: string, archivo: File, onProgreso: (pct: number) => void) {
  return new Promise<void>((resolver, rechazar) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgreso(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolver() : rechazar(new Error(`HTTP ${xhr.status}`)));
    xhr.onerror = () => rechazar(new Error("red"));
    const datos = new FormData();
    datos.append("cacheControl", "3600");
    datos.append("", archivo);
    xhr.send(datos);
  });
}

export function Adjuntar({ estado, onCambio }: { estado: EstadoAdjunto; onCambio: (e: EstadoAdjunto) => void }) {
  const t = useTranslations("cargar.adjunto");
  const entrada = useRef<HTMLInputElement>(null);

  async function elegir(archivo: File | undefined) {
    if (entrada.current) entrada.current.value = "";
    if (!archivo) return;
    if (!esTipoAdjunto(archivo.type)) return onCambio({ estado: "error", mensaje: "errorTipo" });
    if (archivo.size > MAX_BYTES_ADJUNTO) return onCambio({ estado: "error", mensaje: "errorTamano" });

    const nombre = archivo.name.slice(0, 200);
    const tipo = archivo.type;
    onCambio({ estado: "subiendo", nombre, pct: 0 });
    try {
      const permiso = await prepararAdjunto({ nombre, tipo, bytes: archivo.size });
      if (!permiso.ok) throw new Error(permiso.error);
      await subir(permiso.url, archivo, (pct) => onCambio({ estado: "subiendo", nombre, pct }));
      onCambio({ estado: "listo", adjunto: { ruta: permiso.ruta, nombre, tipo, bytes: archivo.size } });
    } catch (error) {
      console.error(error);
      onCambio({ estado: "error", mensaje: "errorSubida" });
    }
  }

  return (
    <div className="grid gap-3">
      {estado?.estado === "listo" ? (
        <div className="flex items-center gap-3 rounded-card border-[1.5px] border-gold bg-orange-soft p-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange text-ink">
            <Icono nombre="check" className="size-5" />
          </span>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <b className="font-head text-[0.95rem]">{t("listo")}</b>
            <small className="truncate text-[0.86rem] text-ink-2">{estado.adjunto.nombre}</small>
          </div>
          <button type="button" onClick={() => onCambio(null)} aria-label={t("quitar")} className="grid size-10 cursor-pointer place-items-center rounded-full text-ink-2 hover:bg-card">
            <Icono nombre="x" className="size-[18px]" />
          </button>
        </div>
      ) : estado?.estado === "subiendo" ? (
        <div className="grid gap-2 rounded-card border-[1.5px] border-line bg-card p-4" role="status">
          <span className="truncate text-[0.9rem] font-semibold">{estado.nombre}</span>
          <div className="h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full bg-orange transition-[width]" style={{ width: `${estado.pct}%` }} />
          </div>
          <small className="text-[0.84rem] text-muted">{t("subiendo", { pct: estado.pct })}</small>
        </div>
      ) : (
        <label className="grid cursor-pointer justify-items-center gap-2 rounded-card border-2 border-dashed border-line bg-card px-4 py-6 text-center transition-colors hover:border-gold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink">
          <input
            ref={entrada}
            type="file"
            accept={[...Object.keys(TIPOS_ADJUNTO), ".pdf", ".jpg", ".jpeg", ".png"].join(",")}
            className="sr-only"
            onChange={(e) => elegir(e.target.files?.[0])}
          />
          <Icono nombre="upload" className="size-7 text-orange-ink" />
          <span className="font-head font-medium">{t("elegir")}</span>
          <small className="text-[0.86rem] text-muted">{t("formatos")}</small>
        </label>
      )}

      {estado?.estado === "error" && (
        <p role="alert" className="text-[0.9rem] font-medium text-error">
          {t(estado.mensaje)}
        </p>
      )}
    </div>
  );
}

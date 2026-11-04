import Image from "next/image";
import { useTranslations } from "next-intl";
import { Icono } from "@/components/ui/Icono";
import type { Referencias } from "@/lib/datos/referencias";
import { soles } from "@/lib/formato";
import type { DiaItinerario, Itinerario } from "@/lib/motor";

/** Línea de tiempo del itinerario, día por día. Sirve tanto en servidor como en cliente. */
export function LineaDeTiempo({ itinerario, referencias }: { itinerario: Itinerario; referencias: Referencias }) {
  return (
    <ol className="relative grid gap-5 before:absolute before:top-3 before:bottom-3 before:left-[17px] before:w-0.5 before:bg-line min-[600px]:before:left-[23px]">
      {itinerario.dias.map((d) => (
        <Dia key={d.numero} dia={d} referencias={referencias} />
      ))}
    </ol>
  );
}

function Dia({ dia, referencias }: { dia: DiaItinerario; referencias: Referencias }) {
  const t = useTranslations("itinerario.dia");
  const tm = useTranslations("motor");
  const destino = referencias.destinos[dia.destinoId];
  const e = dia.experienciaId ? referencias.experiencias[dia.experienciaId] : undefined;
  const compacto = dia.tipo === "traslado" || dia.tipo === "continuacion" || dia.tipo === "libre";

  const titulo =
    dia.tipo === "traslado" ? t("traslado")
    : dia.tipo === "libre" ? t("libre")
    : dia.tipo === "texto_libre" ? dia.textoLibre
    : dia.tipo === "continuacion" ? t("sigue", { experiencia: e!.nombre })
    : e!.nombre;

  const etiqueta = "rounded-full border border-line bg-sand px-2.5 py-1 text-[0.78rem] font-semibold text-ink-2";

  return (
    <li className="relative grid grid-cols-[36px_1fr] gap-3 min-[600px]:grid-cols-[48px_1fr] min-[600px]:gap-5">
      <span
        aria-hidden="true"
        className={`relative z-1 grid size-9 place-items-center rounded-full border-2 font-head text-[0.8rem] font-extrabold min-[600px]:size-12 min-[600px]:text-[0.95rem] ${
          compacto ? "border-line bg-white" : "border-orange bg-orange"
        }`}
      >
        {dia.numero}
      </span>
      <article className={`overflow-hidden rounded-panel border border-line bg-white ${compacto ? "" : "shadow-card"}`}>
        {!compacto && (
          <div className="relative aspect-[16/7] bg-sand">
            {e?.imagenUrl ? (
              <Image src={e.imagenUrl} alt="" fill sizes="(min-width: 1000px) 640px, 100vw" className="object-cover" />
            ) : (
              <div className="grid size-full place-items-center bg-[linear-gradient(135deg,var(--color-orange-soft),var(--color-sand))] font-head text-[1.4rem] font-extrabold text-orange-ink/60">
                {destino.nombre}
              </div>
            )}
          </div>
        )}
        <div className={`grid gap-2 ${compacto ? "px-5 py-4" : "p-5"}`}>
          <span className="font-head text-[0.75rem] font-bold tracking-[0.12em] text-orange-ink uppercase">
            {t("numero", { numero: dia.numero })} · {destino.nombre}
          </span>
          <h3 className={compacto ? "text-[1.02rem]" : "text-[1.2rem]"}>{titulo}</h3>
          <p className="flex items-start gap-2 text-[0.94rem] text-ink-2">
            <Icono nombre={dia.tipo === "traslado" ? "route" : "chispa"} className="mt-0.5 size-4 text-orange-ink" />
            {tm(`porQue.${dia.porQue.codigo}`, dia.porQue.params)}
          </p>
          {dia.tipo === "experiencia" && e && (
            <div className="flex flex-wrap gap-2 pt-1">
              <span className={etiqueta}>{t("dificultad", { n: e.dificultad })}</span>
              {e.dias > 1 && <span className={etiqueta}>{t("duracionDias", { n: e.dias })}</span>}
              <span className={etiqueta}>{soles.format(e.precioDesde)}</span>
            </div>
          )}
          {dia.alternativas.length > 0 && (
            <p className="border-t border-line pt-3 text-[0.85rem] text-muted">
              {t("alternativas")} {dia.alternativas.map((id) => referencias.experiencias[id].nombre).join(" · ")}
            </p>
          )}
        </div>
      </article>
    </li>
  );
}

/** Avisos del motor (aclimatación, lluvias, destinos quitados…). */
export function Avisos({ avisos }: { avisos: Itinerario["avisos"] }) {
  const t = useTranslations("itinerario");
  const tm = useTranslations("motor");
  if (!avisos.length) return null;
  return (
    <div className="grid gap-2 rounded-card border border-dashed border-warn-line bg-warn-bg p-4 text-[0.92rem] text-[#5c4500]">
      <b className="flex items-center gap-2 font-head text-[#3d2e00]">
        <Icono nombre="alerta" className="size-[18px]" /> {t("avisos")}
      </b>
      <ul className="grid list-disc gap-1 pl-5">
        {avisos.map((a) => (
          <li key={a.codigo + JSON.stringify(a.params)}>{tm(`avisos.${a.codigo}`, a.params)}</li>
        ))}
      </ul>
    </div>
  );
}

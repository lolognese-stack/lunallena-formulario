"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Avisos, LineaDeTiempo } from "@/components/itinerario/LineaDeTiempo";
import { Icono, type NombreIcono } from "@/components/ui/Icono";
import { referenciasDe } from "@/lib/datos/referencias";
import { soles } from "@/lib/formato";
import { catalogoPrueba as catalogo } from "@/lib/motor/catalogo-prueba";
import { buildItinerary, type CategoriaHotel, type Estilo } from "@/lib/motor";

const ESTILOS: { valor: Estilo; icono: NombreIcono }[] = [
  { valor: "clasico", icono: "building" },
  { valor: "aventura", icono: "mountain" },
  { valor: "mistico", icono: "chispa" },
  { valor: "relax", icono: "bed" },
];
const HOTELES: CategoriaHotel[] = ["economico", "estandar", "superior"];

const destinos = new Map(catalogo.destinos.map((d) => [d.id, d]));

const etiqueta = "font-head text-[0.85rem] font-bold text-ink";
const chip =
  "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-line bg-white px-3.5 text-[0.9rem] font-semibold transition-colors hover:border-[#cfc6be] aria-pressed:border-orange aria-pressed:bg-orange-soft";

function Contador({ valor, min, max, onCambio, menos, mas }: { valor: number; min: number; max: number; onCambio: (n: number) => void; menos: string; mas: string }) {
  const boton = "size-11 cursor-pointer text-[1.3rem] text-ink disabled:cursor-not-allowed disabled:text-[#c9c2bb]";
  return (
    <div className="flex min-h-12 items-center rounded-sm border-[1.5px] border-line bg-white">
      <button type="button" className={boton} aria-label={menos} disabled={valor <= min} onClick={() => onCambio(valor - 1)}>
        −
      </button>
      <output className="flex-1 text-center font-bold" aria-live="polite">
        {valor}
      </output>
      <button type="button" className={boton} aria-label={mas} disabled={valor >= max} onClick={() => onCambio(valor + 1)}>
        +
      </button>
    </div>
  );
}

export function Laboratorio() {
  const t = useTranslations("prueba");
  const tc = useTranslations("comun");

  const [dias, setDias] = useState(7);
  const [mes, setMes] = useState(7);
  const [elegidos, setElegidos] = useState<string[]>(["cusco", "valle-sagrado", "machu-picchu"]);
  const [estilo, setEstilo] = useState<Estilo>("clasico");
  const [viajeros, setViajeros] = useState(2);
  const [hotel, setHotel] = useState<CategoriaHotel>("estandar");

  const itinerario = useMemo(
    () => buildItinerary({ dias, mes, destinos: elegidos, estilo, viajeros, hotel }, catalogo),
    [dias, mes, elegidos, estilo, viajeros, hotel],
  );

  const alternar = (id: string) =>
    setElegidos((actual) => (actual.includes(id) ? (actual.length > 1 ? actual.filter((x) => x !== id) : actual) : [...actual, id]));

  const meses = tc.raw("meses") as string[];
  const { precio } = itinerario;

  return (
    <div className="wrap grid items-start gap-[clamp(24px,4vw,48px)] min-[1000px]:grid-cols-[360px_minmax(0,1fr)]">
      {/* Formulario */}
      <form
        className="grid gap-5 rounded-panel border border-line bg-white p-5 shadow-card min-[1000px]:sticky min-[1000px]:top-24"
        onSubmit={(e) => e.preventDefault()}
        aria-label={t("form.titulo")}
      >
        <h2 className="text-[1.3rem]">{t("form.titulo")}</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <span className={etiqueta}>{t("form.dias")}</span>
            <Contador valor={dias} min={3} max={15} onCambio={setDias} menos={t("form.menos")} mas={t("form.mas")} />
          </div>
          <label className="grid gap-1.5">
            <span className={etiqueta}>{t("form.mes")}</span>
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="min-h-12 rounded-sm border-[1.5px] border-line bg-white px-3 font-medium focus:border-ink focus:outline-none"
            >
              {meses.map((nombre, i) => (
                <option key={nombre} value={i + 1}>
                  {nombre}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="grid gap-2">
          <legend className={`${etiqueta} mb-2`}>
            {t("form.destinos")} <span className="font-body font-normal text-muted">· {t("form.destinosAyuda")}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {catalogo.destinos.map((d) => (
              <button key={d.id} type="button" className={chip} aria-pressed={elegidos.includes(d.id)} onClick={() => alternar(d.id)}>
                {elegidos.includes(d.id) && <Icono nombre="check" className="size-4 text-orange-ink" />}
                {d.nombre}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className={`${etiqueta} mb-2`}>{t("form.estilo")}</legend>
          <div className="grid grid-cols-2 gap-2">
            {ESTILOS.map(({ valor, icono }) => (
              <button
                key={valor}
                type="button"
                aria-pressed={estilo === valor}
                onClick={() => setEstilo(valor)}
                className="grid cursor-pointer gap-1 rounded-card border-[1.5px] border-line bg-white p-3 text-left transition-colors hover:border-[#cfc6be] aria-pressed:border-orange aria-pressed:bg-orange-soft"
              >
                <Icono nombre={icono} className="size-5 text-orange-ink" />
                <b className="font-head text-[0.92rem] leading-tight">{tc(`estilos.${valor}.nombre`)}</b>
                <small className="text-[0.78rem] leading-snug text-muted">{tc(`estilos.${valor}.texto`)}</small>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <span className={etiqueta}>{t("form.viajeros")}</span>
            <Contador valor={viajeros} min={1} max={12} onCambio={setViajeros} menos={t("form.menosViajeros")} mas={t("form.masViajeros")} />
          </div>
          <label className="grid gap-1.5">
            <span className={etiqueta}>{t("form.hotel")}</span>
            <select
              value={hotel}
              onChange={(e) => setHotel(e.target.value as CategoriaHotel)}
              className="min-h-12 rounded-sm border-[1.5px] border-line bg-white px-3 font-medium focus:border-ink focus:outline-none"
            >
              {HOTELES.map((h) => (
                <option key={h} value={h}>
                  {tc(`hoteles.${h}.nombre`)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </form>

      {/* Resultado */}
      <div className="grid min-w-0 gap-6">
        <div className="grid gap-5 rounded-panel bg-ink p-[clamp(20px,3vw,32px)] text-white">
          <div className="grid gap-2">
            <span className="eyebrow text-orange-light [--eyebrow-line:var(--color-orange-light)]">{t("resultado.ruta")}</span>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-head text-[1.25rem] font-extrabold">
              {itinerario.ruta.map((id, i) => (
                <span key={id} className="inline-flex items-center gap-2">
                  {i > 0 && <Icono nombre="arrow" className="size-4 text-orange" />}
                  {destinos.get(id)!.nombre}
                </span>
              ))}
            </p>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-white/14 pt-5">
            <div>
              <small className="text-[0.85rem] text-white/70">{t("resultado.desde")}</small>
              <b className="block font-head text-[2.2rem] leading-none font-extrabold">
                {soles.format(precio.porPersona)} <span className="text-[1rem] font-semibold text-white/70">{t("resultado.porPersona")}</span>
              </b>
            </div>
            <div className="text-right text-[0.88rem] text-white/75">
              <p className="font-semibold text-white">{t("resultado.total", { total: soles.format(precio.total), viajeros })}</p>
              <p className="max-w-[34ch]">
                {t("resultado.desglose", { experiencias: soles.format(precio.experiencias), hoteles: soles.format(precio.hoteles) })}
              </p>
            </div>
          </div>
        </div>

        <Avisos avisos={itinerario.avisos} />
        <LineaDeTiempo itinerario={itinerario} referencias={referenciasDe(itinerario, catalogo)} />
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type RefObject } from "react";
import { armarViaje } from "@/app/armar/acciones";
import { Armando, conEsperaMinima } from "@/components/armar/Armando";
import { claseOpcion, Contador, SelectorEstilo, SelectorHotel, SelectorMes } from "@/components/armar/Controles";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import type { CategoriaHotel, Estilo } from "@/lib/motor";
import { OCASIONES, PRESUPUESTOS, VUELOS, type Ocasion, type Presupuesto, type Vuelos } from "@/lib/score";
import { BASE } from "@/lib/contacto";

export interface DestinoOpcion {
  id: string;
  nombre: string;
  altitudM: number;
  imagenUrl: string | null;
}

const TOTAL_PASOS = 7;
const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function Asistente({ destinos }: { destinos: DestinoOpcion[] }) {
  const t = useTranslations("armar");
  const titulo = useRef<HTMLHeadingElement>(null);

  const [paso, setPaso] = useState(1);
  const [dias, setDias] = useState(7);
  const [mes, setMes] = useState<number | null>(null);
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [estilo, setEstilo] = useState<Estilo | null>(null);
  const [viajeros, setViajeros] = useState(2);
  const [hotel, setHotel] = useState<CategoriaHotel>("estandar");
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [ocasion, setOcasion] = useState<Ocasion | null>(null);
  const [vuelos, setVuelos] = useState<Vuelos | null>(null);
  const [cuenta, setCuenta] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [ig, setIg] = useState("");
  const [trampa, setTrampa] = useState("");
  const [tocado, setTocado] = useState(false);
  const [listo, setListo] = useState<{ slug: string; prueba: boolean; nivel: string } | null>(null);
  const inicio = useRef(0);
  const [armando, setArmando] = useState(false);
  const [error, setError] = useState(false);

  // Next conserva esta página oculta al navegar al itinerario: si la persona vuelve atrás,
  // que encuentre sus respuestas y no la pantalla "Armando tu viaje…".
  useEffect(() => () => setArmando(false), []);
  useEffect(() => {
    inicio.current = performance.now();
  }, []);

  // Al cambiar de paso: arriba de todo y el foco en el título, para lectores de pantalla.
  const primerRender = useRef(true);
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    titulo.current?.focus();
  }, [paso]);

  const contactoOk = nombre.trim().length >= 2 && EMAIL.test(email.trim());
  const completo =
    paso === 1 ? mes !== null : paso === 2 ? elegidos.length > 0 : paso === 3 ? estilo !== null : paso === 5 ? !!(presupuesto && ocasion && vuelos) : paso === 7 ? contactoOk : true;
  const nombresPasos = t.raw("pasos") as string[];

  async function armar() {
    setTocado(true);
    if (!contactoOk) return;
    setError(false);
    setArmando(true);
    const q = new URLSearchParams(window.location.search);
    const resultado = await conEsperaMinima(
      armarViaje({
        dias, mes, destinos: elegidos, estilo, viajeros, hotel,
        perfil: {
          presupuesto, ocasion, vuelos, cuenta,
          contacto: { nombre, email, ig },
          utm_source: q.get("utm_source") ?? undefined,
          utm_campaign: q.get("utm_campaign") ?? undefined,
          referer: document.referrer.slice(0, 300) || undefined,
          duracion_segundos: Math.round((performance.now() - inicio.current) / 1000),
          apellido_2: trampa || undefined,
        },
      }),
    );
    if (resultado.ok) {
      setArmando(false);
      setListo(resultado);
      window.scrollTo({ top: 0 });
    } else {
      setArmando(false);
      setError(true);
    }
  }

  const alternar = (id: string) => setElegidos((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  if (listo) {
    return (
      <div className="wrap grid max-w-[640px] justify-items-start gap-5 py-16">
        <span className="grid size-14 place-items-center rounded-full bg-gold text-white"><Icono nombre="check" className="size-7" /></span>
        <h1 className="text-[clamp(1.9rem,4.4vw,2.8rem)]">{t("listo.titulo", { nombre: nombre.trim().split(" ")[0] })}</h1>
        <p className="lead">{t("listo.texto", { email: email.trim() })}</p>
        <p className="text-[0.92rem] text-muted">{t("listo.spam")}</p>
        {listo.prueba && (
          <div className="grid w-full gap-3 rounded-card border border-dashed border-warn-line bg-warn-bg p-5 text-warn-ink">
            <p className="text-[0.92rem] font-medium">{t("listo.prueba")}</p>
            <p className="text-[0.85rem]">{t("listo.nivel", { nivel: listo.nivel })}</p>
            <div className="flex flex-wrap gap-2">
              <Boton href={`/itinerario/${listo.slug}`}>{t("listo.verItinerario")}</Boton>
              <Boton href={`${BASE}/correos/${listo.slug}/?n=1`} externo variante="contorno">{t("listo.verCorreos")}</Boton>
            </div>
          </div>
        )}
        <button type="button" onClick={() => window.location.reload()} className="text-[0.92rem] font-semibold text-orange-ink underline">
          {t("listo.otro")}
        </button>
      </div>
    );
  }

  return (
    <div className="wrap max-w-[960px] pb-28">
      {/* Progreso */}
      <ol aria-label={t("progreso")} className="mb-8 grid grid-cols-7 gap-2 pt-6">
        {nombresPasos.map((nombre, i) => (
          <li
            key={nombre}
            aria-current={paso === i + 1 ? "step" : undefined}
            className={`grid gap-2 text-[0.8rem] font-semibold before:h-1 before:rounded-full before:transition-colors before:duration-300 ${
              i + 1 <= paso ? "text-ink before:bg-gold" : "text-muted before:bg-line"
            }`}
          >
            <span className="max-[480px]:sr-only">{nombre}</span>
          </li>
        ))}
      </ol>

      <span className="eyebrow">{t("pasoDe", { n: paso, total: TOTAL_PASOS })}</span>

      {paso === 1 && (
        <section className="mt-3 grid gap-8">
          <Encabezado titulo={t("dias.titulo")} lead={t("dias.lead")} refTitulo={titulo} />
          <Contador valor={dias} min={3} max={15} onCambio={setDias} menos={t("dias.menos")} mas={t("dias.mas")}>
            <b className="block font-head text-[3rem] leading-none font-light">{dias}</b>
            <span className="text-[0.9rem] text-muted">{t("dias.unidad", { n: dias })}</span>
          </Contador>
          <fieldset className="grid gap-3">
            <legend className="mb-1 font-head text-[1.15rem] font-medium">{t("dias.mes")}</legend>
            <p className="-mt-2 text-[0.92rem] text-muted">{t("dias.mesAyuda")}</p>
            <SelectorMes mes={mes} onCambio={setMes} />
          </fieldset>
        </section>
      )}

      {paso === 2 && (
        <section className="mt-3 grid gap-6">
          <Encabezado titulo={t("destinos.titulo")} lead={t("destinos.lead")} refTitulo={titulo} />
          <div className="grid grid-cols-2 gap-3 min-[800px]:grid-cols-4">
            {destinos.map((d) => {
              const elegido = elegidos.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={elegido}
                  onClick={() => alternar(d.id)}
                  className={`group relative isolate flex aspect-[4/5] cursor-pointer flex-col justify-end overflow-hidden rounded-card p-3.5 text-left text-white outline-offset-4 transition-shadow ${
                    elegido ? "shadow-[0_0_0_3px_var(--color-gold)]" : ""
                  }`}
                >
                  {d.imagenUrl ? (
                    <Image src={d.imagenUrl} alt="" fill sizes="(min-width: 800px) 220px, 50vw" className="-z-20 object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <span className="absolute inset-0 -z-20 bg-[linear-gradient(160deg,#b8935a,var(--color-gold-dark))]" />
                  )}
                  <span className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,transparent_35%,rgba(0,0,0,.75))]" />
                  <span
                    aria-hidden="true"
                    className={`absolute top-3 right-3 grid size-8 place-items-center rounded-full border-2 transition-colors ${
                      elegido ? "border-gold bg-gold text-white" : "border-white/80 bg-black/20"
                    }`}
                  >
                    {elegido && <Icono nombre="check" className="size-4" />}
                  </span>
                  <b className="font-head text-[1.08rem] leading-tight font-medium">{d.nombre}</b>
                  <small className="mt-0.5 text-[0.8rem] opacity-85">{t("destinos.altitud", { m: d.altitudM.toLocaleString("es-PE") })}</small>
                </button>
              );
            })}
          </div>
          <p className="flex items-start gap-2 text-[0.92rem] text-muted">
            <Icono nombre="pin" className="mt-0.5 size-4 text-orange-ink" /> {t("destinos.base")}
          </p>
        </section>
      )}

      {paso === 3 && (
        <section className="mt-3 grid gap-6">
          <Encabezado titulo={t("estilo.titulo")} lead={t("estilo.lead")} refTitulo={titulo} />
          <SelectorEstilo estilo={estilo} onCambio={setEstilo} />
        </section>
      )}

      {paso === 4 && (
        <section className="mt-3 grid gap-8">
          <Encabezado titulo={t("viajeros.titulo")} lead={t("viajeros.lead")} refTitulo={titulo} />
          <Contador valor={viajeros} min={1} max={20} onCambio={setViajeros} menos={t("viajeros.menos")} mas={t("viajeros.mas")}>
            <b className="block font-head text-[3rem] leading-none font-light">{viajeros}</b>
            <span className="text-[0.9rem] text-muted">{t("viajeros.viajeros")}</span>
          </Contador>
          <fieldset className="grid gap-3">
            <legend className="mb-1 font-head text-[1.15rem] font-medium">{t("viajeros.hotel")}</legend>
            <SelectorHotel hotel={hotel} onCambio={setHotel} />
          </fieldset>
        </section>
      )}

      {paso === 5 && (
        <section className="mt-3 grid gap-8">
          <Encabezado titulo={t("presupuesto.titulo")} lead={t("presupuesto.lead")} refTitulo={titulo} />
          <Opciones valores={PRESUPUESTOS} elegido={presupuesto} onCambio={setPresupuesto} etiqueta={(v) => t(`presupuesto.opciones.${v}`)} columnas="min-[560px]:grid-cols-3" />
          <fieldset className="grid gap-3">
            <legend className="mb-1 font-head text-[1.15rem] font-medium">{t("ocasion.titulo")}</legend>
            <Opciones valores={OCASIONES} elegido={ocasion} onCambio={setOcasion} etiqueta={(v) => t(`ocasion.opciones.${v}`)} columnas="min-[560px]:grid-cols-3" />
          </fieldset>
          <fieldset className="grid gap-3">
            <legend className="mb-1 font-head text-[1.15rem] font-medium">{t("vuelos.titulo")}</legend>
            <Opciones valores={VUELOS} elegido={vuelos} onCambio={setVuelos} etiqueta={(v) => t(`vuelos.opciones.${v}`)} columnas="min-[560px]:grid-cols-3" />
          </fieldset>
        </section>
      )}

      {paso === 6 && (
        <section className="mt-3 grid gap-4">
          <Encabezado titulo={t("cuenta.titulo")} lead={t("cuenta.lead")} refTitulo={titulo} />
          <textarea
            value={cuenta}
            onChange={(e) => setCuenta(e.target.value.slice(0, 2000))}
            rows={6}
            placeholder={t("cuenta.placeholder")}
            aria-label={t("cuenta.titulo")}
            className="w-full rounded-card border-[1.5px] border-line bg-card p-4 text-[1rem] leading-relaxed outline-none focus:border-gold"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-[0.85rem] text-muted">
            <span>{t("cuenta.ayuda")}</span>
            <span>{t("cuenta.caracteres", { n: cuenta.trim().length })}</span>
          </div>
        </section>
      )}

      {paso === 7 && (
        <section className="mt-3 grid gap-6">
          <Encabezado titulo={t("contacto.titulo")} lead={t("contacto.lead")} refTitulo={titulo} />
          <div className="grid max-w-[520px] gap-4">
            <Campo etiqueta={t("contacto.nombre")} valor={nombre} onCambio={setNombre} autoComplete="name" error={tocado && nombre.trim().length < 2 ? t("contacto.nombreFalta") : null} />
            <Campo etiqueta={t("contacto.email")} valor={email} onCambio={setEmail} tipo="email" autoComplete="email" error={tocado && !EMAIL.test(email.trim()) ? t("contacto.emailInvalido") : null} />
            <Campo etiqueta={t("contacto.ig")} valor={ig} onCambio={setIg} autoComplete="off" />
            <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trampa} onChange={(e) => setTrampa(e.target.value)} className="absolute -left-[9999px] size-px opacity-0" name="apellido_2" />
            <p className="text-[0.85rem] text-muted">{t("contacto.privacidad")}</p>
          </div>
        </section>
      )}

      {/* Navegación fija abajo */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[rgba(246,241,234,.95)] pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {error && (
          <p role="alert" className="wrap max-w-[960px] pt-3 text-[0.9rem] font-medium text-error">
            {t("error")}
          </p>
        )}
        <div className="wrap flex max-w-[960px] items-center justify-between gap-3 py-3">
          {paso > 1 ? (
            <Boton variante="contorno" onClick={() => setPaso((p) => p - 1)}>
              <Icono nombre="back" /> {t("nav.atras")}
            </Boton>
          ) : (
            <span />
          )}
          {paso < TOTAL_PASOS ? (
            <Boton disabled={!completo} onClick={() => setPaso((p) => p + 1)}>
              {paso === 6 && !cuenta.trim() ? t("cuenta.omitir") : t("nav.siguiente")} <Icono nombre="arrow" />
            </Boton>
          ) : (
            <Boton disabled={armando || !contactoOk} onClick={armar}>
              {t("nav.armar")} <Icono nombre="arrow" />
            </Boton>
          )}
        </div>
      </div>

      {armando && <Armando titulo={t("armando.titulo")} pasos={t.raw("armando.pasos") as string[]} />}
    </div>
  );
}

function Encabezado({ titulo, lead, refTitulo }: { titulo: string; lead: string; refTitulo: RefObject<HTMLHeadingElement | null> }) {
  return (
    <div className="grid gap-3">
      <h1 ref={refTitulo} tabIndex={-1} className="text-[clamp(1.9rem,4.4vw,2.8rem)] outline-none">
        {titulo}
      </h1>
      <p className="lead">{lead}</p>
    </div>
  );
}

function Opciones<T extends string>({ valores, elegido, onCambio, etiqueta, columnas }: { valores: readonly T[]; elegido: T | null; onCambio: (v: T) => void; etiqueta: (v: T) => string; columnas: string }) {
  return (
    <div className={`grid grid-cols-2 gap-2.5 ${columnas}`}>
      {valores.map((v) => (
        <button key={v} type="button" aria-pressed={elegido === v} onClick={() => onCambio(v)} className={`${claseOpcion} min-h-14 px-4 py-3 font-semibold`}>
          {etiqueta(v)}
        </button>
      ))}
    </div>
  );
}

function Campo({ etiqueta, valor, onCambio, tipo = "text", autoComplete, error }: { etiqueta: string; valor: string; onCambio: (v: string) => void; tipo?: string; autoComplete?: string; error?: string | null }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[0.92rem] font-semibold">{etiqueta}</span>
      <input
        type={tipo}
        value={valor}
        autoComplete={autoComplete}
        onChange={(e) => onCambio(e.target.value)}
        aria-invalid={!!error}
        className="h-13 rounded-sm border-[1.5px] border-line bg-card px-4 text-[1rem] outline-none focus:border-gold aria-invalid:border-error"
      />
      {error && <span className="text-[0.85rem] text-error">{error}</span>}
    </label>
  );
}

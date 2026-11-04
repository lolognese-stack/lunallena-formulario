"use client";

// Quiz funnel v2: una pregunta por pantalla, se avanza al tocar.
//   1 viajeros · 2 experiencias · 3 cuándo · 4 días · 5 hotel · 6 presupuesto · 7 etapa + vuelos
//   → POST /api/score-parcial → (puente, solo si el servidor manda preguntas)
//   8 vista previa + datos → POST /api/lead → final según grupo.
// El score nunca se calcula ni se ve en el navegador.

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Armando, conEsperaMinima } from "@/components/armar/Armando";
import { Boton } from "@/components/ui/Boton";
import { Icono, IconoWhatsApp } from "@/components/ui/Icono";
import { BASE } from "@/lib/contacto";
import type { TarjetaExperiencia } from "@/lib/leads/experiencias";
import type { VistaPrevia as Vista } from "@/lib/leads/vista-previa";
import { MESES_DE_LLUVIA } from "@/lib/motor/config";
import {
  DIAS, ETAPAS, FLEXIBILIDAD, HOTELES, PRESUPUESTOS, VIAJEROS, VUELOS,
  type Etapa, type Flexibilidad, type Hotel, type IdPuente, type Presupuesto, type RangoDias, type RespuestasPuente, type Viajeros, type Vuelos,
} from "@/lib/scoring/opciones";
import { Autoridad } from "./Autoridad";
import { Campo, Chips, claseOpcion, Encabezado, Progreso } from "./piezas";
import { aE164, paisInicial, Telefono, telefonoValido, type ValorTelefono } from "./Telefono";
import { VistaPrevia } from "./VistaPrevia";

export type Tarjeta = TarjetaExperiencia & { imagenUrl: string | null };

const PASOS = ["viajeros", "experiencias", "cuando", "dias", "hotel", "presupuesto", "etapa", "datos"] as const;
type Paso = (typeof PASOS)[number] | "puente" | "final";

interface Pregunta {
  id: IdPuente;
  titulo: string;
  opciones: { valor: string; etiqueta: string }[];
}
interface ResultadoLead {
  leadId: string;
  grupo: "calificado" | "no_calificado";
  whatsappUrl?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const AVANCE_MS = 160; // se ve la selección antes de pasar
const api = (ruta: string) => `${BASE}/api/${ruta}/`;

export function Quiz({ tarjetas }: { tarjetas: Tarjeta[] }) {
  const t = useTranslations("quiz");
  const tc = useTranslations("comun");
  const titulo = useRef<HTMLHeadingElement>(null);

  const [paso, setPaso] = useState<Paso>("viajeros");
  const [viajeros, setViajeros] = useState<Viajeros | null>(null);
  const [experiencias, setExperiencias] = useState<string[]>([]);
  const [mes, setMes] = useState<number | null>(null);
  const [flexibilidad, setFlexibilidad] = useState<Flexibilidad | null>(null);
  const [dias, setDias] = useState<RangoDias | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [etapa, setEtapa] = useState<Etapa | null>(null);
  const [vuelos, setVuelos] = useState<Vuelos | null>(null);

  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [puente, setPuente] = useState<RespuestasPuente>({});
  const [vista, setVista] = useState<Vista | null>(null);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState<ValorTelefono>({ pais: "PE", numero: "" });
  const [comentario, setComentario] = useState("");
  const [trampa, setTrampa] = useState("");
  const [tocado, setTocado] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoLead | null>(null);

  useEffect(() => setTelefono((v) => ({ ...v, pais: paisInicial() })), []);

  // ---------- Navegación (con historial: el "atrás" del celular vuelve un paso) ----------
  const ir = useCallback((p: Paso) => {
    setError(null);
    setPaso(p);
    window.history.pushState({ quiz: p }, "");
  }, []);

  useEffect(() => {
    window.history.replaceState({ quiz: "viajeros" }, "");
    const alVolver = (e: PopStateEvent) => {
      const p = (e.state as { quiz?: Paso } | null)?.quiz;
      setError(null);
      setPaso(p ?? "viajeros");
    };
    window.addEventListener("popstate", alVolver);
    return () => window.removeEventListener("popstate", alVolver);
  }, []);

  const primerRender = useRef(true);
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    titulo.current?.focus({ preventScroll: true });
  }, [paso]);

  const despues = (p: Paso) => setTimeout(() => ir(p), AVANCE_MS);

  // ---------- Score parcial (al terminar el paso 7) ----------
  const respuestas = () => ({ viajeros, experiencias, mes, flexibilidad, dias, hotel, presupuesto, etapa, vuelos });

  async function calcularParcial(etapaFinal = etapa, vuelosFinal = vuelos) {
    setCargando(true);
    setError(null);
    try {
      const res = await conEsperaMinima(
        fetch(api("score-parcial"), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ respuestas: { ...respuestas(), etapa: etapaFinal, vuelos: vuelosFinal } }),
        }),
        1200,
      );
      if (!res.ok) throw new Error(String(res.status));
      const r = (await res.json()) as { preguntas: Pregunta[]; vistaPrevia: Vista };
      setPreguntas(r.preguntas);
      setPuente({});
      setVista(r.vistaPrevia);
      ir(r.preguntas.length ? "puente" : "datos");
    } catch {
      setError(t("datos.error"));
    } finally {
      setCargando(false);
    }
  }

  // ---------- Envío del lead ----------
  const errNombre = nombre.trim().length < 2 ? t("datos.nombreFalta") : null;
  const errEmail = !EMAIL.test(email.trim()) ? t("datos.emailInvalido") : null;
  const errTelefono = telefono.numero.trim() && !telefonoValido(telefono) ? t("datos.whatsappInvalido") : null;

  async function enviar() {
    setTocado(true);
    if (errNombre || errEmail || errTelefono) return;
    setEnviando(true);
    setError(null);
    const q = new URLSearchParams(window.location.search);
    const utm = Object.fromEntries((["source", "medium", "campaign", "content"] as const).map((k) => [k, q.get(`utm_${k}`) ?? undefined]).filter(([, v]) => v));
    try {
      const res = await fetch(api("lead"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          respuestas: respuestas(),
          puente,
          contacto: { nombre: nombre.trim(), email: email.trim(), whatsapp: aE164(telefono) },
          comentario: comentario.trim(),
          utm,
          referrer: document.referrer.slice(0, 500) || undefined,
          empresa: trampa || undefined,
        }),
      });
      if (res.status === 429) throw new Error("limite");
      if (!res.ok) throw new Error(String(res.status));
      setResultado((await res.json()) as ResultadoLead);
      ir("final");
    } catch (e) {
      setError((e as Error).message === "limite" ? t("datos.limite") : t("datos.error"));
    } finally {
      setEnviando(false);
    }
  }

  function abrirWhatsapp() {
    if (!resultado?.whatsappUrl) return;
    // Se avisa antes de abrir WhatsApp; keepalive para que llegue aunque la página cambie.
    fetch(api(`lead/${resultado.leadId}/wa-click`), { method: "POST", keepalive: true }).catch(() => {});
    window.location.href = resultado.whatsappUrl;
  }

  // ---------- Pantalla final ----------
  if (paso === "final" && resultado) {
    const primerNombre = nombre.trim().split(" ")[0];
    const calificado = resultado.grupo === "calificado";
    return (
      <div className="wrap grid max-w-[640px] justify-items-start gap-5 py-14">
        <span className="grid size-14 place-items-center rounded-full bg-gold text-white">
          <Icono nombre="check" className="size-7" />
        </span>
        <h1 ref={titulo} tabIndex={-1} className="text-[clamp(1.9rem,6vw,2.8rem)] outline-none">
          {calificado ? t("final.calificado.titulo", { nombre: primerNombre }) : t("final.no_calificado.titulo")}
        </h1>
        <p className="lead">{calificado ? t("final.calificado.texto") : t("final.no_calificado.texto", { email: email.trim() })}</p>
        {calificado && resultado.whatsappUrl && (
          <Boton onClick={abrirWhatsapp} bloque className="min-h-15 bg-whatsapp text-[0.82rem] text-[#0b3d20] hover:bg-[#1fbd5a]">
            <IconoWhatsApp className="size-6" /> {t("final.calificado.boton")}
          </Boton>
        )}
        {calificado && <p className="text-[0.92rem] text-muted">{t("final.calificado.mail", { email: email.trim() })}</p>}
        <p className="text-[0.88rem] text-muted">{t("final.spam")}</p>
        <button type="button" onClick={() => window.location.assign(`${BASE}/`)} className="cursor-pointer text-[0.92rem] font-semibold text-orange-ink underline">
          {t("final.otro")}
        </button>
      </div>
    );
  }

  // ---------- Pasos ----------
  const indice = paso === "puente" ? PASOS.indexOf("etapa") : PASOS.indexOf(paso as (typeof PASOS)[number]);
  const completo: Record<Paso, boolean> = {
    viajeros: viajeros !== null,
    experiencias: experiencias.length > 0,
    cuando: mes !== null && flexibilidad !== null,
    dias: dias !== null,
    hotel: hotel !== null,
    presupuesto: presupuesto !== null,
    etapa: etapa !== null && vuelos !== null,
    puente: preguntas.every((p) => puente[p.id] !== undefined),
    datos: true,
    final: true,
  };
  const siguiente = (): Paso => (paso === "etapa" ? "puente" : paso === "puente" ? "datos" : PASOS[indice + 1]);

  function avanzar() {
    if (paso === "etapa") return void calcularParcial();
    if (paso === "datos") return void enviar();
    ir(siguiente());
  }

  return (
    <div className="wrap max-w-[880px] pt-5 pb-32">
      <Progreso paso={indice + 1} total={PASOS.length} texto={t("progreso", { n: indice + 1, total: PASOS.length })} />

      <div className="mt-6 grid gap-6">
        {paso === "viajeros" && (
          <>
            <Encabezado titulo={t("viajeros.titulo")} lead={t("viajeros.lead")} refTitulo={titulo} />
            <Chips
              nombre={t("viajeros.titulo")}
              valores={VIAJEROS}
              elegido={viajeros}
              etiqueta={(v) => t(`viajeros.opciones.${v}`)}
              onElegir={(v) => {
                setViajeros(v);
                despues("experiencias");
              }}
            />
          </>
        )}

        {paso === "experiencias" && (
          <>
            <Encabezado titulo={t("experiencias.titulo")} lead={t("experiencias.lead")} refTitulo={titulo} />
            <div role="group" aria-label={t("experiencias.titulo")} className="grid grid-cols-2 gap-2.5 min-[720px]:grid-cols-3">
              {tarjetas.map((x) => {
                const elegida = experiencias.includes(x.id);
                return (
                  <button
                    key={x.id}
                    type="button"
                    aria-pressed={elegida}
                    onClick={() => setExperiencias((a) => (elegida ? a.filter((i) => i !== x.id) : [...a, x.id]))}
                    className={`group relative isolate flex aspect-[4/5] cursor-pointer flex-col justify-end overflow-hidden rounded-card p-3 text-left text-white outline-offset-4 transition-shadow min-[720px]:aspect-[4/3] ${
                      elegida ? "shadow-[0_0_0_3px_var(--color-gold)]" : ""
                    }`}
                  >
                    {x.imagenUrl ? (
                      <Image src={x.imagenUrl} alt="" fill sizes="(min-width: 720px) 280px, 50vw" className="-z-20 object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <span className="absolute inset-0 -z-20 bg-[linear-gradient(160deg,#b8935a,var(--color-gold-dark))]" />
                    )}
                    <span className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,transparent_40%,rgba(0,0,0,.75))]" />
                    <span aria-hidden="true" className={`absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full border-2 transition-colors ${elegida ? "border-gold bg-gold" : "border-white/80 bg-black/20"}`}>
                      {elegida && <Icono nombre="check" className="size-4" />}
                    </span>
                    <b className="font-head text-[1.02rem] leading-tight font-medium">{x.nombre}</b>
                  </button>
                );
              })}
            </div>
            <p aria-live="polite" className="text-[0.88rem] text-muted">
              {t("experiencias.elegidas", { n: experiencias.length })}
            </p>
          </>
        )}

        {paso === "cuando" && (
          <>
            <Encabezado titulo={t("cuando.titulo")} lead={t("cuando.lead")} refTitulo={titulo} />
            <div role="group" aria-label={t("cuando.titulo")} className="grid grid-cols-3 gap-2 min-[600px]:grid-cols-4 min-[800px]:grid-cols-6">
              {(tc.raw("meses") as string[]).map((nombreMes, i) => (
                <button
                  key={nombreMes}
                  type="button"
                  aria-pressed={mes === i + 1}
                  onClick={() => {
                    setMes(i + 1);
                    if (flexibilidad) despues("dias");
                  }}
                  className={`${claseOpcion} grid min-h-14 place-items-center px-1 py-2 text-center`}
                >
                  <span className="text-[0.95rem] font-semibold">{nombreMes}</span>
                  {MESES_DE_LLUVIA.includes(i + 1) && <small className="text-[0.7rem] text-muted">{t("cuando.lluvias")}</small>}
                </button>
              ))}
            </div>
            <h2 className="text-[1.15rem] font-medium">{t("cuando.fechas")}</h2>
            <Chips
              nombre={t("cuando.fechas")}
              valores={FLEXIBILIDAD}
              elegido={flexibilidad}
              columnas="grid-cols-1 min-[600px]:grid-cols-3"
              etiqueta={(v) => t(`cuando.flexibilidad.${v}`)}
              onElegir={(v) => {
                setFlexibilidad(v);
                if (mes !== null) despues("dias");
              }}
            />
          </>
        )}

        {paso === "dias" && (
          <>
            <Encabezado titulo={t("dias.titulo")} lead={t("dias.lead")} refTitulo={titulo} />
            <Chips
              nombre={t("dias.titulo")}
              valores={DIAS}
              elegido={dias}
              columnas="grid-cols-2"
              etiqueta={(v) => t(`dias.opciones.${v}`)}
              onElegir={(v) => {
                setDias(v);
                despues("hotel");
              }}
            />
          </>
        )}

        {paso === "hotel" && (
          <>
            <Encabezado titulo={t("hotel.titulo")} lead={t("hotel.lead")} refTitulo={titulo} />
            <div role="group" aria-label={t("hotel.titulo")} className="grid gap-2.5 min-[700px]:grid-cols-3">
              {HOTELES.map((h) => (
                <button
                  key={h}
                  type="button"
                  aria-pressed={hotel === h}
                  onClick={() => {
                    setHotel(h);
                    despues("presupuesto");
                  }}
                  className={`${claseOpcion} grid gap-1 p-4`}
                >
                  <b className="font-head text-[1.05rem] font-medium">{tc(`hoteles.${h}.nombre`)}</b>
                  <small className="text-[0.88rem] text-muted">{tc(`hoteles.${h}.texto`)}</small>
                </button>
              ))}
            </div>
          </>
        )}

        {paso === "presupuesto" && (
          <>
            <Encabezado titulo={t("presupuesto.titulo")} lead={t("presupuesto.lead")} refTitulo={titulo} />
            <Chips
              nombre={t("presupuesto.titulo")}
              valores={PRESUPUESTOS}
              elegido={presupuesto}
              columnas="grid-cols-1 min-[600px]:grid-cols-2"
              etiqueta={(v) => t(`presupuesto.opciones.${v}`)}
              onElegir={(v) => {
                setPresupuesto(v);
                despues("etapa");
              }}
            />
          </>
        )}

        {paso === "etapa" && (
          <>
            <Encabezado titulo={t("etapa.titulo")} lead={t("etapa.lead")} refTitulo={titulo} />
            <Chips
              nombre={t("etapa.titulo")}
              valores={ETAPAS}
              elegido={etapa}
              columnas="grid-cols-1 min-[600px]:grid-cols-3"
              etiqueta={(v) => t(`etapa.opciones.${v}`)}
              onElegir={(v) => {
                setEtapa(v);
                if (vuelos) void calcularParcial(v, vuelos);
              }}
            />
            <h2 className="text-[1.15rem] font-medium">{t("etapa.vuelos")}</h2>
            <Chips
              nombre={t("etapa.vuelos")}
              valores={VUELOS}
              elegido={vuelos}
              columnas="grid-cols-1 min-[600px]:grid-cols-3"
              etiqueta={(v) => t(`etapa.vuelosOpciones.${v}`)}
              onElegir={(v) => {
                setVuelos(v);
                if (etapa) void calcularParcial(etapa, v);
              }}
            />
          </>
        )}

        {paso === "puente" && (
          <>
            <Encabezado titulo={t("puente.titulo")} refTitulo={titulo} />
            {preguntas.map((p) => (
              <div key={p.id} className="grid gap-3">
                <h2 className="text-[1.15rem] font-medium">{p.titulo}</h2>
                <Chips
                  nombre={p.titulo}
                  valores={p.opciones.map((o) => o.valor)}
                  elegido={puente[p.id]}
                  columnas="grid-cols-1"
                  etiqueta={(v) => p.opciones.find((o) => o.valor === v)?.etiqueta ?? v}
                  onElegir={(v) => {
                    const nuevas = { ...puente, [p.id]: v } as RespuestasPuente;
                    setPuente(nuevas);
                    if (preguntas.every((q) => nuevas[q.id] !== undefined)) despues("datos");
                  }}
                />
              </div>
            ))}
          </>
        )}

        {paso === "datos" && vista && (
          <>
            <Encabezado titulo={t("datos.titulo", { dias: vista.totalDias })} lead={t("datos.lead")} refTitulo={titulo} />
            <VistaPrevia vista={vista} />
            <Autoridad />
            <form
              noValidate
              className="relative grid max-w-[560px] gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                void enviar();
              }}
            >
              <h2 className="text-[1.3rem] font-light">{t("datos.formTitulo")}</h2>
              <Campo id="q-nombre" etiqueta={t("datos.nombre")} valor={nombre} onCambio={setNombre} autoComplete="name" error={tocado ? errNombre : null} />
              <Campo id="q-email" etiqueta={t("datos.email")} valor={email} onCambio={setEmail} tipo="email" inputMode="email" autoComplete="email" error={tocado ? errEmail : null} />
              <Telefono valor={telefono} onCambio={setTelefono} etiqueta={t("datos.whatsapp")} etiquetaPais={t("datos.pais")} error={tocado ? errTelefono : null} />
              <div className="grid gap-1.5">
                <label htmlFor="q-comentario" className="text-[0.92rem] font-semibold">
                  {t("datos.comentario")}
                </label>
                <textarea
                  id="q-comentario"
                  rows={3}
                  maxLength={1000}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  aria-describedby="q-comentario-ayuda"
                  className="rounded-sm border-[1.5px] border-line bg-card p-3.5 text-[1rem] leading-relaxed outline-none focus:border-gold"
                />
                <span id="q-comentario-ayuda" className="text-[0.82rem] text-muted">
                  {t("datos.comentarioAyuda")}
                </span>
              </div>
              {/* Honeypot: invisible para personas; un bot lo completa. */}
              <input type="text" name="empresa" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trampa} onChange={(e) => setTrampa(e.target.value)} className="absolute -left-[9999px] size-px opacity-0" />
              <p className="text-[0.82rem] text-muted">{t("datos.privacidad")}</p>
              <button type="submit" hidden />
            </form>
          </>
        )}
      </div>

      {/* Barra fija abajo: volver en cada paso y seguir cuando hace falta */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[rgba(246,241,234,.96)] pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {error && (
          <p role="alert" className="wrap max-w-[880px] pt-3 text-[0.9rem] font-medium text-error">
            {error}
          </p>
        )}
        <div className="wrap flex max-w-[880px] items-center justify-between gap-3 py-3">
          {paso !== "viajeros" ? (
            <Boton variante="contorno" onClick={() => window.history.back()}>
              <Icono nombre="back" /> {t("atras")}
            </Boton>
          ) : (
            <span />
          )}
          {paso === "datos" ? (
            <Boton disabled={enviando} onClick={() => void enviar()}>
              {enviando ? t("datos.enviando") : t("datos.enviar")} <Icono nombre="arrow" />
            </Boton>
          ) : (
            <Boton disabled={!completo[paso] || cargando} onClick={avanzar}>
              {t("siguiente")} <Icono nombre="arrow" />
            </Boton>
          )}
        </div>
      </div>

      {cargando && <Armando titulo={t("armando.titulo")} pasos={t.raw("armando.pasos") as string[]} />}
    </div>
  );
}

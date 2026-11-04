// Scoring v2 del armador (quiz funnel). Máximo 100. Se calcula SOLO en el servidor:
// nunca se usa un score que mande el navegador.
//
// Funciones puras y deterministas: todo lo que depende del mundo (fecha de hoy, precio
// "desde" del itinerario armado) entra por `contexto`.
//
//   Factor                           Máx  Puntos
//   Etapa                            20   listo 20 · comparando 13 · mirando 4
//   Presupuesto pp vs precio desde   20   ratio ≥1: 20 · 0,75–0,99: 12 · 0,50–0,74: 5 · <0,50: 0 · "no sé": 6
//   Ticket total (pp × viajeros)     15   >3000: 15 · 1500–3000: 11 · 800–1499: 7 · <800: 0 · "no sé": 3
//   Cuándo viaja                     15   <1 mes: 8 · 1–6: 15 · 7–9: 12 · >9: 5
//   Vuelos                           10   comprados 10 · cotizando 5 · todavía no 0
//   Duración (piso del rango)         5   10+: 5 · 7–9: 4 · 5–6: 3 · <5: 1
//   Hotel                             5   superior 5 · estándar 3 · económico 1
//   Comentario                        5   concreto 5 · vago 2 · vacío 0
//   WhatsApp válido                   5   válido 5 · inválido o vacío 0
//
// Score parcial (al terminar el paso 7): sin comentario ni WhatsApp, máx 90. Entre 40 y 59
// (zona gris) se muestran 1 o 2 preguntas puente; sus puntos suman al total final.
// Total final: tope 100, piso 0.
//
// Reglas duras (pisan el puntaje; si chocan, gana no_calificado):
//   - ratio de presupuesto < 0,50                      → no_calificado
//   - puente de precio = "Lejos de lo que pensaba"     → no_calificado
//   - etapa "listo para reservar" + vuelos "comprados" → calificado

import { clasificarComentario } from "./comentario";
import { whatsappValido } from "./whatsapp";

export const SCORE_VERSION = "v2";
export const UMBRAL_CALIFICADO = 60;
export const ZONA_GRIS = { desde: 40, hasta: 59 } as const;

// ---------- Respuestas ----------

export const VIAJEROS = [1, 2, 3, 4, 5, 6] as const; // 6 = "6+"
export const DIAS = ["4-5", "6-7", "8-10", "11+"] as const;
export const HOTELES = ["economico", "estandar", "superior"] as const;
export const PRESUPUESTOS = ["lt500", "500-1000", "1000-1500", "1500-2500", "gt2500", "nose"] as const;
export const ETAPAS = ["listo", "comparando", "mirando"] as const;
export const VUELOS = ["comprados", "cotizando", "no"] as const;
export const FLEXIBILIDAD = ["fijas", "aproximadas", "flexible"] as const;

export type Viajeros = (typeof VIAJEROS)[number];
export type RangoDias = (typeof DIAS)[number];
export type Hotel = (typeof HOTELES)[number];
export type Presupuesto = (typeof PRESUPUESTOS)[number];
export type Etapa = (typeof ETAPAS)[number];
export type Vuelos = (typeof VUELOS)[number];
export type Flexibilidad = (typeof FLEXIBILIDAD)[number];

export const PUENTE = {
  precio: ["dentro", "alto", "lejos"],
  reserva: ["este_mes", "1a3_meses", "nose"],
  decide: ["solo_yo", "falta_alguien"],
} as const;
export type IdPuente = keyof typeof PUENTE;
export type RespuestasPuente = { [K in IdPuente]?: (typeof PUENTE)[K][number] };

export interface Respuestas {
  viajeros: Viajeros;
  experiencias: string[]; // no suma puntos; lo usa el motor
  mes: number; // 1–12
  flexibilidad: Flexibilidad; // no suma puntos; se guarda
  dias: RangoDias;
  hotel: Hotel;
  presupuesto: Presupuesto;
  etapa: Etapa;
  vuelos: Vuelos;
  comentario?: string;
  whatsapp?: string; // E.164: "+51987654321"
  puente?: RespuestasPuente;
}

export interface Contexto {
  hoy: Date;
  /** Precio "desde" por persona del itinerario armado, en USD. Sin precio válido: null. */
  precioDesdeUsd: number | null;
}

// ---------- Tablas de puntos ----------

/** Punto medio de cada rango de presupuesto por persona, en USD. "nose" no tiene. */
export const MEDIO_USD: Record<Presupuesto, number | null> = {
  lt500: 400,
  "500-1000": 750,
  "1000-1500": 1250,
  "1500-2500": 2000,
  gt2500: 3000,
  nose: null,
};

/** Piso de cada rango de días (lo que usa el score). */
export const PISO_DIAS: Record<RangoDias, number> = { "4-5": 4, "6-7": 6, "8-10": 8, "11+": 11 };

export const MAXIMOS = {
  etapa: 20,
  presupuesto: 20,
  ticket: 15,
  cuando: 15,
  vuelos: 10,
  duracion: 5,
  hotel: 5,
  comentario: 5,
  whatsapp: 5,
} as const;

const PUNTOS_ETAPA: Record<Etapa, number> = { listo: 20, comparando: 13, mirando: 4 };
const PUNTOS_VUELOS: Record<Vuelos, number> = { comprados: 10, cotizando: 5, no: 0 };
const PUNTOS_HOTEL: Record<Hotel, number> = { superior: 5, estandar: 3, economico: 1 };
const PUNTOS_COMENTARIO = { concreto: 5, vago: 2, vacio: 0 } as const;

export const PUNTOS_PUENTE: { [K in IdPuente]: Record<(typeof PUENTE)[K][number], number> } = {
  precio: { dentro: 10, alto: 3, lejos: -10 },
  reserva: { este_mes: 10, "1a3_meses": 5, nose: 0 },
  decide: { solo_yo: 5, falta_alguien: 0 },
};

// ---------- Factores (exportados para testear bordes) ----------

/** Ratio presupuesto = punto medio pp / precio desde. null si no se puede calcular. */
export function ratioPresupuesto(presupuesto: Presupuesto, precioDesdeUsd: number | null): number | null {
  const medio = MEDIO_USD[presupuesto];
  if (medio === null || precioDesdeUsd === null || !Number.isFinite(precioDesdeUsd) || precioDesdeUsd <= 0) return null;
  return medio / precioDesdeUsd;
}

export function puntosPresupuesto(ratio: number | null): number {
  // Sin ratio ("no sé" o itinerario sin precio): puntos de "no sé".
  if (ratio === null) return 6;
  if (ratio >= 1) return 20;
  if (ratio >= 0.75) return 12;
  if (ratio >= 0.5) return 5;
  return 0;
}

export function ticketTotalUsd(presupuesto: Presupuesto, viajeros: number): number | null {
  const medio = MEDIO_USD[presupuesto];
  return medio === null ? null : medio * viajeros;
}

export function puntosTicket(total: number | null): number {
  if (total === null) return 3;
  if (total > 3000) return 15;
  if (total >= 1500) return 11;
  if (total >= 800) return 7;
  return 0;
}

/** Meses hasta el viaje. Mes actual = 0; si el mes ya pasó este año, es del año siguiente. */
export function mesesHasta(mes: number, hoy: Date): number {
  return (((mes - (hoy.getMonth() + 1)) % 12) + 12) % 12;
}

export function puntosCuando(meses: number): number {
  if (meses < 1) return 8;
  if (meses <= 6) return 15;
  if (meses <= 9) return 12;
  return 5;
}

export function puntosDuracion(dias: number): number {
  if (dias >= 10) return 5;
  if (dias >= 7) return 4;
  if (dias >= 5) return 3;
  return 1;
}

// ---------- Score parcial y preguntas puente ----------

export type Desglose = Record<keyof typeof MAXIMOS | "puente", number>;

export interface PreguntaPuente {
  id: IdPuente;
  titulo: string;
  opciones: { valor: string; etiqueta: string }[];
}

export interface ResultadoParcial {
  total: number; // 0–90
  desglose: Omit<Desglose, "comentario" | "whatsapp" | "puente">;
  ratio: number | null;
  zonaGris: boolean;
  preguntas: PreguntaPuente[];
}

const formatoUsd = (n: number) => Math.round(n).toLocaleString("es-PE");

function armarPregunta(id: IdPuente, precioDesdeUsd: number | null): PreguntaPuente {
  switch (id) {
    case "precio":
      return {
        id,
        titulo: `Viajes como el tuyo arrancan en USD ${formatoUsd(precioDesdeUsd ?? 0)} por persona. ¿Te sirve?`,
        opciones: [
          { valor: "dentro", etiqueta: "Sí, está dentro" },
          { valor: "alto", etiqueta: "Un poco alto, pero lo veo" },
          { valor: "lejos", etiqueta: "Lejos de lo que pensaba" },
        ],
      };
    case "reserva":
      return {
        id,
        titulo: "Si el itinerario te convence, ¿cuándo reservarías?",
        opciones: [
          { valor: "este_mes", etiqueta: "Esta semana o este mes" },
          { valor: "1a3_meses", etiqueta: "En 1 a 3 meses" },
          { valor: "nose", etiqueta: "Todavía no sé" },
        ],
      };
    case "decide":
      return {
        id,
        titulo: "¿Alguien más decide el viaje?",
        opciones: [
          { valor: "solo_yo", etiqueta: "Solo yo, o ya estamos de acuerdo" },
          { valor: "falta_alguien", etiqueta: "Falta convencer a alguien" },
        ],
      };
  }
}

/**
 * Qué preguntas puente mostrar (máximo 2, en este orden):
 *   A) precio: presupuesto "no sé" o ratio entre 0,50 y 0,99 (y el itinerario tiene precio)
 *   B) reserva: etapa "comparando" o vuelos "todavía no"
 *   C) decide: solo si A y B no aplican
 */
export function seleccionarPuente(r: Respuestas, ratio: number | null, precioDesdeUsd: number | null): IdPuente[] {
  const hayPrecio = precioDesdeUsd !== null && Number.isFinite(precioDesdeUsd) && precioDesdeUsd > 0;
  const ids: IdPuente[] = [];
  if (hayPrecio && (r.presupuesto === "nose" || (ratio !== null && ratio >= 0.5 && ratio < 1))) ids.push("precio");
  if (r.etapa === "comparando" || r.vuelos === "no") ids.push("reserva");
  if (ids.length === 0) ids.push("decide");
  return ids.slice(0, 2);
}

export function scoreParcial(r: Respuestas, ctx: Contexto): ResultadoParcial {
  const ratio = ratioPresupuesto(r.presupuesto, ctx.precioDesdeUsd);
  const desglose = {
    etapa: PUNTOS_ETAPA[r.etapa],
    presupuesto: puntosPresupuesto(ratio),
    ticket: puntosTicket(ticketTotalUsd(r.presupuesto, r.viajeros)),
    cuando: puntosCuando(mesesHasta(r.mes, ctx.hoy)),
    vuelos: PUNTOS_VUELOS[r.vuelos],
    duracion: puntosDuracion(PISO_DIAS[r.dias]),
    hotel: PUNTOS_HOTEL[r.hotel],
  };
  const total = Object.values(desglose).reduce((a, b) => a + b, 0);
  const zonaGris = total >= ZONA_GRIS.desde && total <= ZONA_GRIS.hasta;
  const preguntas = zonaGris ? seleccionarPuente(r, ratio, ctx.precioDesdeUsd).map((id) => armarPregunta(id, ctx.precioDesdeUsd)) : [];
  return { total, desglose, ratio, zonaGris, preguntas };
}

// ---------- Score final ----------

export type Grupo = "calificado" | "no_calificado";
export type Regla = "presupuesto_menor_50" | "puente_precio_lejos" | "listo_con_vuelos";

export interface ResultadoScore {
  total: number; // 0–100
  desglose: Desglose;
  reglasAplicadas: Regla[];
  grupo: Grupo;
  scoreVersion: typeof SCORE_VERSION;
  parcial: number;
  vioPuente: boolean;
  preguntasMostradas: IdPuente[];
  /** Solo las respuestas puente de preguntas que el servidor mostró; el resto se ignora. */
  respuestasPuente: RespuestasPuente;
}

const REGLAS_NO_CALIFICADO: Regla[] = ["presupuesto_menor_50", "puente_precio_lejos"];

/** Tope 100, piso 0. */
export function acotarTotal(n: number): number {
  return Math.max(0, Math.min(100, n));
}

export function scoreLead(r: Respuestas, ctx: Contexto): ResultadoScore {
  const parcial = scoreParcial(r, ctx);
  const mostradas = parcial.preguntas.map((p) => p.id);

  // El servidor vuelve a decidir qué preguntas se mostraron: respuestas a otras no cuentan.
  const respuestasPuente: RespuestasPuente = {};
  let puente = 0;
  for (const id of mostradas) {
    const valor = r.puente?.[id];
    if (valor === undefined || !(PUENTE[id] as readonly string[]).includes(valor)) continue;
    (respuestasPuente as Record<string, string>)[id] = valor;
    puente += (PUNTOS_PUENTE[id] as Record<string, number>)[valor];
  }

  const desglose: Desglose = {
    ...parcial.desglose,
    comentario: PUNTOS_COMENTARIO[clasificarComentario(r.comentario)],
    whatsapp: whatsappValido(r.whatsapp) ? 5 : 0,
    puente,
  };
  const total = acotarTotal(Object.values(desglose).reduce((a, b) => a + b, 0));

  const reglasAplicadas: Regla[] = [];
  if (parcial.ratio !== null && parcial.ratio < 0.5) reglasAplicadas.push("presupuesto_menor_50");
  if (respuestasPuente.precio === "lejos") reglasAplicadas.push("puente_precio_lejos");
  if (r.etapa === "listo" && r.vuelos === "comprados") reglasAplicadas.push("listo_con_vuelos");

  let grupo: Grupo = total >= UMBRAL_CALIFICADO ? "calificado" : "no_calificado";
  if (reglasAplicadas.includes("listo_con_vuelos")) grupo = "calificado";
  if (reglasAplicadas.some((x) => REGLAS_NO_CALIFICADO.includes(x))) grupo = "no_calificado"; // gana no_calificado

  return {
    total,
    desglose,
    reglasAplicadas,
    grupo,
    scoreVersion: SCORE_VERSION,
    parcial: parcial.total,
    vioPuente: mostradas.length > 0,
    preguntasMostradas: mostradas,
    respuestasPuente,
  };
}

/** ¿Alguna regla dura de no_calificado? El score vivo no puede revertirlas. */
export function tieneReglaNoCalificado(reglas: readonly string[]): boolean {
  return reglas.some((x) => (REGLAS_NO_CALIFICADO as string[]).includes(x));
}

// Score de calificación del armador (1 a 10), aprobado por la agencia.
// Misma escala y niveles que el formulario /cotizar (caliente ≥ 7, tibio 5–6,
// frío < 5), así el CRM los lee igual. Se calcula SIEMPRE en el servidor.
//
//   Presupuesto total del viaje (pp × viajeros)   30
//   Presupuesto vs. precio "desde" del itinerario 15
//   Cuándo viaja                                  15
//   Vuelos                                        15
//   Ocasión                                       10
//   Duración                                      10
//   Lo que nos contó (opcional, por largo)        10
//   Hotel                                          5
//                                                ----
//                                                 110  → se lleva a 100

import type { CategoriaHotel } from "@/lib/motor";

export const PRESUPUESTOS = ["lt500", "500-1000", "1000-1500", "1500-2500", "gt2500", "nose"] as const;
export const OCASIONES = ["luna_miel", "aniversario", "familia", "amigos", "solo", "otro"] as const;
export const VUELOS = ["comprados", "cotizando", "no"] as const;

export type Presupuesto = (typeof PRESUPUESTOS)[number];
export type Ocasion = (typeof OCASIONES)[number];
export type Vuelos = (typeof VUELOS)[number];
export type Nivel = "caliente" | "tibio" | "frio";

/** Punto medio de cada rango, en USD por persona (sin vuelos internacionales). */
const MEDIO_USD: Record<Presupuesto, number | null> = {
  lt500: 400, "500-1000": 750, "1000-1500": 1250, "1500-2500": 2000, gt2500: 3000, nose: null,
};

/** Soles por dólar para comparar con el precio "desde" del motor (que está en soles). */
export const SOLES_POR_USD = 3.75;

export const MAXIMOS = { presupuesto: 30, encaje: 15, cuando: 15, vuelos: 15, ocasion: 10, duracion: 10, cuenta: 10, hotel: 5 };
const SUMA_MAX = Object.values(MAXIMOS).reduce((a, b) => a + b, 0);

export interface EntradaScore {
  presupuesto: Presupuesto;
  viajeros: number;
  precioDesdeSoles: number; // por persona, del itinerario armado
  mes: number; // 1–12
  vuelos: Vuelos;
  ocasion: Ocasion;
  dias: number;
  hotel: CategoriaHotel;
  cuenta: string;
}

export interface Score {
  total: number; // 0–100
  score10: number; // 1–10
  categoria: Nivel;
  accion: string;
  desglose: Record<keyof typeof MAXIMOS, number>;
  presupuestoTotalUsd: number | null;
  precioDesdeUsd: number;
}

/** Meses desde hoy hasta el próximo `mes` (0 = este mes). */
export function mesesHasta(mes: number, hoy = new Date()) {
  return (mes - (hoy.getMonth() + 1) + 12) % 12;
}

export function calcularScore(e: EntradaScore, hoy = new Date()): Score {
  const medio = MEDIO_USD[e.presupuesto];
  const totalUsd = medio === null ? null : medio * e.viajeros;
  const precioUsd = e.precioDesdeSoles / SOLES_POR_USD;

  const presupuesto = totalUsd === null ? 3 : totalUsd > 3000 ? 30 : totalUsd >= 1500 ? 22 : totalUsd >= 800 ? 15 : 0;
  const encaje = medio === null ? 5 : !precioUsd || medio >= precioUsd ? 15 : medio >= precioUsd * 0.75 ? 8 : 0;
  const m = mesesHasta(e.mes, hoy);
  const cuando = m <= 4 ? 15 : m <= 8 ? 9 : 3;
  const vuelos = e.vuelos === "comprados" ? 15 : e.vuelos === "cotizando" ? 7 : 0;
  const ocasion = { luna_miel: 10, aniversario: 10, familia: 8, amigos: 6, solo: 4, otro: 5 }[e.ocasion];
  const duracion = e.dias >= 10 ? 10 : e.dias >= 7 ? 8 : e.dias >= 5 ? 5 : 2;
  const largo = e.cuenta.trim().length;
  const cuenta = largo >= 150 ? 10 : largo >= 40 ? 6 : largo > 0 ? 3 : 0;
  const hotel = { superior: 5, estandar: 3, economico: 1 }[e.hotel];

  const desglose = { presupuesto, encaje, cuando, vuelos, ocasion, duracion, cuenta, hotel };
  const suma = Object.values(desglose).reduce((a, b) => a + b, 0);
  const total = Math.round((suma / SUMA_MAX) * 100);
  const score10 = Math.max(1, Math.min(10, Math.round(total / 10)));
  const categoria: Nivel = score10 >= 7 ? "caliente" : score10 >= 5 ? "tibio" : "frio";
  const accion = {
    caliente: "Contactar en menos de 1 hora: ya tiene el itinerario y el botón de WhatsApp.",
    tibio: "Recibió el itinerario con WhatsApp. Si no escribe en 2 días, escribirle para completar lo que falta.",
    frio: "Sin WhatsApp en el primer mail: sigue la secuencia de mails. WhatsApp abierto en el último (día 8).",
  }[categoria];
  return { total, score10, categoria, accion, desglose, presupuestoTotalUsd: totalUsd, precioDesdeUsd: Math.round(precioUsd) };
}

/** Caliente y tibio ven WhatsApp desde el primer mail; frío desde el día 8. */
export function veWhatsapp(categoria: Nivel | undefined, creadoEn: string, ahora = Date.now()) {
  if (!categoria || categoria !== "frio") return true;
  return ahora - new Date(creadoEn).getTime() >= 7.5 * 86400000;
}

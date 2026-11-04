// Tarjetas del paso 2 ("¿Qué quieres vivir?") y cómo se traducen al motor.
//
// El motor arma por destinos y estilo. Cada tarjeta suma sus destinos; si alguna es de
// aventura (Camino Inca, Montaña de Colores), el estilo es "aventura"; si no, "clasico".
// Solo se ofrecen las tarjetas cuyos destinos existen en el catálogo activo.
// Amazonía queda fuera hasta que esté en el catálogo.

import type { Catalogo, CategoriaHotel, Estilo, Respuestas as RespuestasMotor } from "@/lib/motor";
import type { RangoDias, Respuestas } from "@/lib/scoring/v2";

export interface TarjetaExperiencia {
  id: string;
  nombre: string;
  destinos: string[];
  aventura: boolean;
  /** Experiencia del catálogo de donde se toma la foto (o el destino, si no tiene). */
  fotoDe: string;
}

export const TARJETAS: TarjetaExperiencia[] = [
  { id: "machu-picchu", nombre: "Machu Picchu", destinos: ["machu-picchu"], aventura: false, fotoDe: "mapi-full-day-tren-turistico" },
  { id: "camino-inca", nombre: "Camino Inca", destinos: ["machu-picchu"], aventura: true, fotoDe: "camino-inka-tradicional-4d" },
  { id: "valle-sagrado", nombre: "Valle Sagrado", destinos: ["valle-sagrado"], aventura: false, fotoDe: "valle-sagrado-vip-maras-moray" },
  { id: "cusco", nombre: "Cusco y sus alrededores", destinos: ["cusco"], aventura: false, fotoDe: "city-tour-cusco" },
  { id: "montana-colores", nombre: "Montaña de Colores", destinos: ["cusco"], aventura: true, fotoDe: "montana-de-colores" },
  { id: "titicaca", nombre: "Lago Titicaca", destinos: ["puno"], aventura: false, fotoDe: "uros-taquile" },
  { id: "colca", nombre: "Arequipa y Cañón del Colca", destinos: ["arequipa", "colca"], aventura: false, fotoDe: "colca-cruz-del-condor" },
  { id: "paracas", nombre: "Paracas y Huacachina", destinos: ["paracas"], aventura: false, fotoDe: "islas-ballestas" },
  { id: "lima", nombre: "Lima", destinos: ["lima"], aventura: false, fotoDe: "lima-centro-historico" },
];

export const IDS_TARJETAS = TARJETAS.map((t) => t.id);

/** Tarjetas disponibles con el catálogo activo, con su foto. */
export function tarjetasOfrecidas(catalogo: Catalogo) {
  const destinos = new Set(catalogo.destinos.map((d) => d.id));
  return TARJETAS.filter((t) => t.destinos.every((d) => destinos.has(d))).map((t) => {
    const exp = catalogo.experiencias.find((e) => e.slug === t.fotoDe || e.id === t.fotoDe);
    const dest = catalogo.destinos.find((d) => d.id === t.destinos[0]);
    return { ...t, imagenUrl: exp?.imagenUrl ?? dest?.imagenUrl ?? null };
  });
}

/** Días que usa el motor para cada rango (el score usa el piso; ver scoring/v2.ts). */
export const DIAS_MOTOR: Record<RangoDias, number> = { "4-5": 5, "6-7": 7, "8-10": 9, "11+": 12 };

/** Respuestas del quiz → entrada del motor. Ignora tarjetas que no existen en el catálogo. */
export function respuestasMotor(r: Respuestas, catalogo: Catalogo): RespuestasMotor {
  const ofrecidas = new Map(tarjetasOfrecidas(catalogo).map((t) => [t.id, t]));
  const elegidas = r.experiencias.map((id) => ofrecidas.get(id)).filter((t): t is TarjetaExperiencia & { imagenUrl: string | null } => !!t);
  const destinos = [...new Set(elegidas.flatMap((t) => t.destinos))];
  const estilo: Estilo = elegidas.some((t) => t.aventura) ? "aventura" : "clasico";
  return { dias: DIAS_MOTOR[r.dias], mes: r.mes, destinos, estilo, viajeros: r.viajeros, hotel: r.hotel as CategoriaHotel };
}

/** Nombres de las tarjetas elegidas, para el mensaje de WhatsApp y los mails. */
export function nombresTarjetas(ids: string[]): string[] {
  return ids.map((id) => TARJETAS.find((t) => t.id === id)?.nombre).filter((n): n is string => !!n);
}

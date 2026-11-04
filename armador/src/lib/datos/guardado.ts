// Formato con el que se guarda un itinerario en la tabla `itineraries`.
import { createHash, randomBytes } from "node:crypto";
import type { DiaFijo, Estilo, Itinerario, Respuestas } from "@/lib/motor";
import type { Json, TablesInsert } from "@/lib/supabase/database.types";
import type { Adjunto } from "./adjunto";
import type { Referencias } from "./referencias";
import type { Nivel, Ocasion, Presupuesto, Score, Vuelos } from "@/lib/score";

/** Lo que agrega el quiz del armador (no existe en itinerarios viejos). */
export interface Perfil {
  presupuesto: Presupuesto;
  ocasion: Ocasion;
  vuelos: Vuelos;
  cuenta: string;
  contacto: { nombre: string; email: string; ig: string };
  score: Score;
  /** Ids de Resend de la secuencia, para cancelarla si escribe por WhatsApp. */
  correos?: { n: number; id: string; para: string }[];
  prueba?: boolean;
}
export type { Nivel };

export type FuenteCatalogo = "supabase" | "prueba";

/** Columna `source`: B = "Ármalo por mí", A = cargado por el cliente, mixto = cargado y completado. */
export type Origen = "A" | "B" | "mixto";

/** En el flujo A el cliente no elige estilo. */
export interface RespuestasGuardadas extends Omit<Respuestas, "estilo"> {
  estilo: Estilo | null;
}

export interface ItinerarioGuardado {
  slug: string;
  creadoEn: string;
  origen: Origen;
  respuestas: RespuestasGuardadas;
  fuenteCatalogo: FuenteCatalogo;
  itinerario: Itinerario;
  referencias: Referencias;
  /** Flujos A y mixto: lo que cargó el cliente, tal como lo recibió el motor. */
  cargados?: DiaFijo[];
  /** Solo para el equipo: la página nunca muestra el nombre ni la ruta del archivo. */
  adjunto?: Adjunto;
  /** Armador: filtro, contacto y score. La página nunca muestra el contacto. */
  perfil?: Perfil;
}

/** Lo que va en la columna `answers` (jsonb). */
interface RespuestasEnFila extends RespuestasGuardadas {
  fuenteCatalogo: FuenteCatalogo;
  cargados?: DiaFijo[];
  adjunto?: Adjunto;
  perfil?: Perfil;
}

/** Lo que va en la columna `days` (jsonb). Si cambia la forma, subir la versión. */
interface DiasGuardados extends Itinerario {
  version: 1;
  referencias: Referencias;
}

export const FORMATO_SLUG = /^[A-Za-z0-9_-]{10}$/;

/** 10 caracteres aleatorios URL-safe: ~60 bits, no adivinable. */
export const generarSlug = () => randomBytes(8).toString("base64url").slice(0, 10);

export const generarTokenEdicion = () => randomBytes(24).toString("base64url");

/** Cookie con el token de edición: quien creó el itinerario puede editarlo (Fase 5). */
export const cookieEdicion = (slug: string) => `ll_edicion_${slug}`;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export function filaDesdeGuardado(g: ItinerarioGuardado, editTokenHash: string): TablesInsert<"itineraries"> {
  const dias: DiasGuardados = { version: 1, ...g.itinerario, referencias: g.referencias };
  return {
    share_slug: g.slug,
    edit_token_hash: editTokenHash,
    source: g.origen,
    answers: { ...g.respuestas, fuenteCatalogo: g.fuenteCatalogo, cargados: g.cargados, adjunto: g.adjunto, perfil: g.perfil } satisfies RespuestasEnFila as unknown as Json,
    days: dias as unknown as Json,
    price_from_total_pen: g.itinerario.precio.porPersona,
    lang: "es",
  };
}

export function guardadoDesdeFila(fila: { share_slug: string; created_at: string; source: Origen; answers: Json; days: Json }): ItinerarioGuardado {
  const { fuenteCatalogo, cargados, adjunto, perfil, ...respuestas } = fila.answers as unknown as RespuestasEnFila;
  const { version, referencias, ...itinerario } = fila.days as unknown as DiasGuardados;
  if (version !== 1) throw new Error(`Versión de itinerario desconocida: ${version}`);
  return {
    slug: fila.share_slug,
    creadoEn: fila.created_at,
    origen: fila.source,
    respuestas,
    fuenteCatalogo,
    itinerario,
    referencias,
    ...(cargados && { cargados }),
    ...(adjunto && { adjunto }),
    ...(perfil && { perfil }),
  };
}

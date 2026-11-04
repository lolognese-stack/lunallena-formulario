import "server-only";
import { cookies } from "next/headers";
import {
  FORMATO_SLUG,
  cookieEdicion,
  filaDesdeGuardado,
  generarSlug,
  generarTokenEdicion,
  guardadoDesdeFila,
  hashToken,
  type ItinerarioGuardado,
} from "./guardado";
import { clienteServicio } from "./supabase";

type Fila = Parameters<typeof guardadoDesdeFila>[0];

/**
 * Sin SUPABASE_SECRET_KEY, en desarrollo los itinerarios se guardan en memoria (se pierden
 * al reiniciar). En producción la clave es obligatoria, salvo que ITINERARIOS_EN_MEMORIA=1
 * (solo para probar el build localmente).
 */
const memoria: Map<string, Fila> = ((globalThis as { __itinerariosEnMemoria?: Map<string, Fila> }).__itinerariosEnMemoria ??= new Map());

function sinClave(): never | void {
  if (process.env.NODE_ENV === "production" && process.env.ITINERARIOS_EN_MEMORIA !== "1") {
    throw new Error("Falta SUPABASE_SECRET_KEY: no se pueden guardar ni leer itinerarios.");
  }
}

/** Guarda el itinerario con un slug aleatorio y devuelve el slug y el token de edición (sin hashear). */
export async function guardarItinerario(datos: Omit<ItinerarioGuardado, "slug" | "creadoEn">) {
  const supabase = clienteServicio();
  const token = generarTokenEdicion();

  for (let intento = 0; intento < 3; intento++) {
    const slug = generarSlug();
    const fila = filaDesdeGuardado({ ...datos, slug, creadoEn: new Date().toISOString() }, hashToken(token));

    if (!supabase) {
      sinClave();
      if (memoria.has(slug)) continue;
      memoria.set(slug, { share_slug: slug, created_at: new Date().toISOString(), source: fila.source, answers: fila.answers!, days: fila.days! });
      return { slug, token };
    }

    const { error } = await supabase.from("itineraries").insert(fila);
    if (!error) return { slug, token };
    if (error.code !== "23505") throw new Error(`No se pudo guardar el itinerario: ${error.message}`);
    // 23505: el slug ya existe; se prueba con otro.
  }
  throw new Error("No se pudo generar un slug único.");
}

/**
 * Guarda un itinerario nuevo y deja en el navegador la cookie con el token de edición
 * (httpOnly: el JavaScript de la página no la ve). Solo desde Server Actions.
 */
export async function crearItinerario(datos: Omit<ItinerarioGuardado, "slug" | "creadoEn">): Promise<string> {
  const { slug, token } = await guardarItinerario(datos);
  (await cookies()).set(cookieEdicion(slug), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return slug;
}

/** Lee un itinerario por su slug público. Nunca devuelve el hash del token ni datos de cotizaciones. */
export async function leerItinerario(slug: string): Promise<ItinerarioGuardado | null> {
  if (!FORMATO_SLUG.test(slug)) return null;
  const supabase = clienteServicio();

  if (!supabase) {
    sinClave();
    const fila = memoria.get(slug);
    return fila ? guardadoDesdeFila(fila) : null;
  }

  const { data, error } = await supabase
    .from("itineraries")
    .select("share_slug, created_at, source, answers, days")
    .eq("share_slug", slug)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el itinerario: ${error.message}`);
  return data ? guardadoDesdeFila(data) : null;
}


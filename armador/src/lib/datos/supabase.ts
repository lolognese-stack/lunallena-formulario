import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const opciones = { auth: { persistSession: false, autoRefreshToken: false } };

/** Cliente con la clave publicable: solo puede leer el catálogo activo (RLS). Null si falta configuración. */
export function clientePublico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && clave ? createClient<Database>(url, clave, opciones) : null;
}

/**
 * Cliente con la clave secreta: lee y escribe itinerarios y cotizaciones.
 * Solo en el servidor (`server-only` hace fallar el build si se importa desde el navegador).
 */
export function clienteServicio() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SECRET_KEY;
  // Error de configuración frecuente: pegar la clave publicable en lugar de la secreta.
  if (clave && (clave.startsWith("sb_publishable_") || clave === process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
    throw new Error("SUPABASE_SECRET_KEY tiene la clave publicable: debe ser la secreta (sb_secret_…).");
  }
  return url && clave ? createClient<Database>(url, clave, opciones) : null;
}

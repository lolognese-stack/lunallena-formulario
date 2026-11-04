import "server-only";
import { randomBytes } from "node:crypto";
import { TIPOS_ADJUNTO, type Adjunto, type TipoAdjunto } from "./adjunto";
import { clienteServicio } from "./supabase";

const BUCKET = "adjuntos";

/** Ruta nueva e imposible de adivinar; el nombre original del archivo no se usa. */
export function rutaNuevoAdjunto(tipo: TipoAdjunto, ahora = new Date()): string {
  const mes = ahora.toISOString().slice(0, 7);
  return `cargas/${mes}/${randomBytes(16).toString("base64url")}.${TIPOS_ADJUNTO[tipo]}`;
}

/**
 * Permiso de subida para una sola ruta (el navegador sube directo a Supabase Storage: una
 * función de Vercel no acepta cuerpos de 10 MB). El bucket, a su vez, rechaza más de 10 MB
 * o tipos que no sean PDF, JPG o PNG. Devuelve null si no hay clave de servicio.
 */
export async function permisoDeSubida(tipo: TipoAdjunto): Promise<{ ruta: string; url: string } | null> {
  const supabase = clienteServicio();
  if (!supabase) return null;
  const ruta = rutaNuevoAdjunto(tipo);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(ruta);
  if (error) throw new Error(`No se pudo preparar la subida: ${error.message}`);
  return { ruta, url: data.signedUrl };
}

/** Comprueba que el archivo existe en el bucket con el tamaño que dice el navegador. */
export async function adjuntoSubido(adjunto: Adjunto): Promise<boolean> {
  const supabase = clienteServicio();
  if (!supabase) return false;
  const { data, error } = await supabase.storage.from(BUCKET).info(adjunto.ruta);
  if (error || !data) return false;
  return data.size === undefined || data.size === adjunto.bytes;
}

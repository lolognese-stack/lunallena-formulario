// Verificación de la firma de los webhooks de Resend (formato Svix):
// HMAC-SHA256 de "{svix-id}.{svix-timestamp}.{cuerpo}" con el secreto (whsec_… en base64).

import { createHmac, timingSafeEqual } from "node:crypto";

export const TOLERANCIA_SEGUNDOS = 300;

export interface CabecerasSvix {
  id: string | null;
  timestamp: string | null;
  firma: string | null;
}

export function firmaSvixValida(cuerpo: string, h: CabecerasSvix, secreto: string | undefined, ahora = Date.now()): boolean {
  if (!secreto || !h.id || !h.timestamp || !h.firma) return false;
  const ts = Number(h.timestamp);
  if (!Number.isFinite(ts) || Math.abs(ahora / 1000 - ts) > TOLERANCIA_SEGUNDOS) return false;
  const clave = Buffer.from(secreto.replace(/^whsec_/, ""), "base64");
  const esperada = createHmac("sha256", clave).update(`${h.id}.${h.timestamp}.${cuerpo}`).digest();
  // La cabecera puede traer varias firmas: "v1,AAA v1,BBB".
  return h.firma.split(" ").some((f) => {
    const b = Buffer.from(f.split(",")[1] ?? "", "base64");
    return b.length === esperada.length && timingSafeEqual(b, esperada);
  });
}

/** Firma un cuerpo como lo haría Resend (para tests). */
export function firmarSvix(cuerpo: string, id: string, timestamp: string, secreto: string): string {
  const clave = Buffer.from(secreto.replace(/^whsec_/, ""), "base64");
  return `v1,${createHmac("sha256", clave).update(`${id}.${timestamp}.${cuerpo}`).digest("base64")}`;
}

/** Comparación en tiempo constante para el secreto del cron. */
export function secretoCoincide(recibido: string | null, esperado: string | undefined): boolean {
  if (!recibido || !esperado) return false;
  const a = Buffer.from(recibido), b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

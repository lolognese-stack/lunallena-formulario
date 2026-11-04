// Estados del lead. Solo avanzan: nuevo → wa_abierto → contactado → cotizado → ganado | perdido.
// "perdido" se puede marcar desde cualquier estado que no sea "ganado".

import type { Estado } from "./tipos";

const ORDEN: Record<Estado, number> = { nuevo: 0, wa_abierto: 1, contactado: 2, cotizado: 3, ganado: 4, perdido: 4 };

/** ¿Se puede pasar de `actual` a `nuevo`? Nunca hacia atrás ni entre ganado y perdido. */
export function puedeAvanzar(actual: Estado, nuevo: Estado): boolean {
  if (actual === nuevo) return false;
  if (actual === "ganado" || actual === "perdido") return false;
  return ORDEN[nuevo] > ORDEN[actual];
}

/** Desde "contactado" en adelante se cancelan los mails pendientes del lead. */
export function cancelaMails(estado: Estado): boolean {
  return ORDEN[estado] >= ORDEN.contactado;
}

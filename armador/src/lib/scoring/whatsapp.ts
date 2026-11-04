// WhatsApp válido = número en formato E.164 ("+" y solo dígitos, ej. "+51987654321")
// que libphonenumber-js reconoce como número válido de su país.

import { parsePhoneNumberFromString } from "libphonenumber-js/max";

const E164 = /^\+[1-9]\d{6,14}$/;

/** Quita espacios, guiones, puntos y paréntesis. No agrega el "+": sin él no es E.164. */
export function limpiarTelefono(valor: string): string {
  return valor.replace(/[\s\-().]/g, "");
}

export function whatsappValido(valor: string | null | undefined): boolean {
  if (!valor) return false;
  const limpio = limpiarTelefono(valor);
  if (!E164.test(limpio)) return false;
  return parsePhoneNumberFromString(limpio)?.isValid() ?? false;
}

/** Devuelve el número normalizado en E.164, o null si no es válido. */
export function normalizarWhatsapp(valor: string | null | undefined): string | null {
  if (!whatsappValido(valor)) return null;
  return parsePhoneNumberFromString(limpiarTelefono(valor!))!.number;
}

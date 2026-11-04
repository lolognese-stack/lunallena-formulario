// Datos fijos de la agencia. Los textos visibles viven en messages/*.json.
export const WHATSAPP_NUMERO = "51930299443";
export const SITIO_PRINCIPAL = "https://lunallenatravel.com";

export function enlaceWhatsApp(mensaje: string) {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}

/** URL pública del sitio (en Vercel, el dominio de producción). */
export function urlDelSitio() {
  const dominio = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return dominio ? `https://${dominio}` : "http://localhost:3000";
}

/** Ruta base: el armador se sirve en lunallenatravel.vercel.app/armador (next.config basePath). */
export const BASE = "/armador";

/**
 * URL pública del armador, la que va en los mails y en el mensaje de WhatsApp.
 * URL_PUBLICA (ej. https://lunallenatravel.vercel.app/armador) gana; si no, el dominio
 * de Vercel del proyecto + /armador.
 */
export function urlPublica() {
  return (process.env.URL_PUBLICA || `${urlDelSitio()}${BASE}`).replace(/\/$/, "");
}

/** CRM de Luna Llena: recibe el lead y los eventos (functions/api/armador.js). */
export const CRM_ARMADOR = process.env.CRM_URL ? `${process.env.CRM_URL.replace(/\/$/, "")}/api/armador` : "https://crm-plantilla.pages.dev/api/armador";

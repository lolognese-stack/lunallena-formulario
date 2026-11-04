// Reglas de los adjuntos del flujo A (docs/plan.md: bucket privado "adjuntos", 10 MB,
// solo PDF, JPG y PNG). Sin dependencias: lo usan el navegador y el servidor.

export const TIPOS_ADJUNTO = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

export type TipoAdjunto = keyof typeof TIPOS_ADJUNTO;

export const MAX_BYTES_ADJUNTO = 10 * 1024 * 1024;

/** `cargas/AAAA-MM/<22 caracteres aleatorios>.<ext>`: el nombre original nunca va en la ruta. */
export const FORMATO_RUTA_ADJUNTO = /^cargas\/\d{4}-\d{2}\/[A-Za-z0-9_-]{22}\.(pdf|jpg|png)$/;

export const esTipoAdjunto = (tipo: string): tipo is TipoAdjunto => tipo in TIPOS_ADJUNTO;

/** Archivo ya subido al bucket y asociado al itinerario. */
export interface Adjunto {
  ruta: string;
  nombre: string;
  tipo: TipoAdjunto;
  bytes: number;
}

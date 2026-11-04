// Secuencia de mails por grupo. ÚNICO lugar donde se configuran los tiempos.
// La cola la maneja nuestro backend (tabla mail_cola + /api/cron/mails), no Resend:
// así se puede cancelar cuando el lead pasa a "contactado".
//
// Los textos de cada plantilla van en src/lib/correo/plantillas-v2.ts (fase 4).

import type { Grupo } from "@/lib/scoring/v2";

export type Plantilla = "itinerario" | "mail_2" | "mail_3" | "mail_4" | "mail_5_whatsapp" | "alerta_sin_contacto" | "alerta_subio_score";

export interface PasoSecuencia {
  plantilla: Plantilla;
  /** Minutos desde que se creó el lead. */
  minutos: number;
  /** Mail interno al equipo (ALERTAS_EMAIL), no a la persona. */
  interno?: boolean;
}

const MIN = 1;
const HORA = 60 * MIN;
const DIA = 24 * HORA;

export const SECUENCIA: Record<Grupo, PasoSecuencia[]> = {
  calificado: [
    { plantilla: "itinerario", minutos: 10 * MIN },
    // Si a los 30 min el lead no pasó a "contactado", alerta al equipo (el cron revisa el estado).
    { plantilla: "alerta_sin_contacto", minutos: 30 * MIN, interno: true },
  ],
  no_calificado: [
    { plantilla: "itinerario", minutos: 10 * MIN },
    { plantilla: "mail_2", minutos: 1 * DIA }, // placeholder
    { plantilla: "mail_3", minutos: 3 * DIA }, // placeholder
    { plantilla: "mail_4", minutos: 5 * DIA }, // placeholder
    { plantilla: "mail_5_whatsapp", minutos: 8 * DIA }, // día 8: lleva botón de WhatsApp
  ],
};

export function pasosDe(grupo: Grupo): PasoSecuencia[] {
  return SECUENCIA[grupo];
}

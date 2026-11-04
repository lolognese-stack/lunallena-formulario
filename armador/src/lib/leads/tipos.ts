// Modelo de datos del armador v2 (tablas lead, evento, mail_cola, intento_ip).
// Ver supabase/migraciones/001_leads_v2.sql.

import type { Grupo, IdPuente, Regla, Respuestas, RespuestasPuente } from "@/lib/scoring/v2";

export const ESTADOS = ["nuevo", "wa_abierto", "contactado", "cotizado", "ganado", "perdido"] as const;
export type Estado = (typeof ESTADOS)[number];

export const TIPOS_EVENTO = ["envio", "wa_click", "mail_enviado", "mail_clic", "visita", "cambio_score", "alerta", "cambio_estado"] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export interface Utm {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
}

export interface Lead {
  id: string;
  codigo: string;
  creadoEn: string;
  nombre: string;
  email: string;
  whatsapp: string | null;
  whatsappCrudo: string | null;
  respuestas: Respuestas;
  scoreTotal: number;
  scoreDesglose: Record<string, number>;
  reglasAplicadas: Regla[];
  scoreVersion: string;
  grupo: Grupo;
  vioPuente: boolean;
  preguntasPuente: IdPuente[];
  respuestasPuente: RespuestasPuente;
  precioDesde: number | null;
  itinerarioSlug: string | null;
  utm: Utm;
  referrer: string | null;
  estado: Estado;
  huella: string;
  ipHash: string | null;
}

export type LeadNuevo = Omit<Lead, "id" | "creadoEn" | "estado"> & { estado?: Estado };

export interface Evento {
  id?: number;
  leadId: string;
  tipo: TipoEvento;
  payload: Record<string, unknown>;
  creadoEn?: string;
}

export type EstadoMail = "pendiente" | "enviado" | "cancelado";

export interface MailEnCola {
  id: number;
  leadId: string;
  plantilla: string;
  enviarEn: string;
  estado: EstadoMail;
  intentos: number;
}

// Eventos de Resend → tabla evento + score vivo. Cada mail que manda la cola lleva las
// etiquetas lead_id y mail_id. Solo interesan los clics: el envío lo registra la propia cola.

import type { Evento, TipoEvento } from "./tipos";
import { sumarPuntos, type DepsVivo } from "./vivo";

const TIPOS: Record<string, TipoEvento> = {
  "email.clicked": "mail_clic",
};

type Etiquetas = Record<string, string> | { name: string; value: string }[];

export interface EventoResend {
  type?: string;
  created_at?: string;
  data?: { email_id?: string; tags?: Etiquetas; click?: { link?: string } };
}

function etiqueta(tags: Etiquetas | undefined, nombre: string): string | undefined {
  if (!tags) return undefined;
  return Array.isArray(tags) ? tags.find((t) => t.name === nombre)?.value : tags[nombre];
}

export async function registrarEventoResend(
  ev: EventoResend,
  svixId: string | null,
  deps: DepsVivo,
): Promise<{ registrado: boolean; motivo?: string; puntos?: boolean }> {
  const tipo = TIPOS[ev.type ?? ""];
  if (!tipo) return { registrado: false, motivo: "tipo_ignorado" };
  const leadId = etiqueta(ev.data?.tags, "lead_id");
  if (!leadId) return { registrado: false, motivo: "sin_lead" };
  if (!(await deps.repo.obtenerLead(leadId))) return { registrado: false, motivo: "lead_no_existe" };

  const mailId = etiqueta(ev.data?.tags, "mail_id") ?? null;
  const resendId = ev.data?.email_id ?? null;
  const evento: Evento = { leadId, tipo, payload: { mailId, resendId, link: ev.data?.click?.link ?? null, svixId } };
  await deps.repo.registrarEvento(evento);
  try {
    await deps.crm.logEvento(evento);
  } catch (e) {
    console.error("CRM logEvento:", e);
  }
  // +5 una sola vez por mail (aunque haga varios clics o Resend reintente el webhook).
  const clave = mailId ?? resendId;
  const vivo = clave ? await sumarPuntos(leadId, "mail_clic", clave, deps) : { aplicado: false };
  return { registrado: true, puntos: vivo.aplicado };
}

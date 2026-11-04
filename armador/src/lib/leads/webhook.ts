// Eventos de Resend → tabla evento. El score vivo (clic +5) se suma en la fase 4.
// Cada mail que manda la cola lleva las etiquetas lead_id y mail_id (fase 4).

import type { CrmSink } from "@/lib/crm/sink";
import type { RepoLeads } from "./repo";
import type { Evento, TipoEvento } from "./tipos";

const TIPOS: Record<string, TipoEvento> = {
  "email.sent": "mail_enviado",
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
  deps: { repo: RepoLeads; crm: CrmSink },
): Promise<{ registrado: boolean; motivo?: string }> {
  const tipo = TIPOS[ev.type ?? ""];
  if (!tipo) return { registrado: false, motivo: "tipo_ignorado" };
  const leadId = etiqueta(ev.data?.tags, "lead_id");
  if (!leadId) return { registrado: false, motivo: "sin_lead" };
  if (!(await deps.repo.obtenerLead(leadId))) return { registrado: false, motivo: "lead_no_existe" };

  const evento: Evento = {
    leadId,
    tipo,
    payload: { mailId: etiqueta(ev.data?.tags, "mail_id") ?? null, resendId: ev.data?.email_id ?? null, link: ev.data?.click?.link ?? null, svixId },
  };
  await deps.repo.registrarEvento(evento);
  try {
    await deps.crm.logEvento(evento);
  } catch (e) {
    console.error("CRM logEvento:", e);
  }
  return { registrado: true };
}

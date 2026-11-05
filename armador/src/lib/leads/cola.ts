// Procesa la cola de mails (tabla mail_cola). La llama GET /api/cron/mails cada 5 minutos.
//
// Por cada mail vencido:
//   - lead contactado o después → se cancela (no debería quedar ninguno: cambiarEstado los cancela).
//   - alerta_sin_contacto → al equipo, solo si el lead sigue sin contactar.
//   - alerta_subio_score → al equipo.
//   - el resto → a la persona. WhatsApp: en mail_5_whatsapp siempre; en cualquiera si el lead
//     es calificado (también si pasó a calificado por score vivo).
// Un mail que falla se reintenta en la próxima corrida; al quinto intento se cancela.

import type { CrmSink } from "@/lib/crm/sink";
import { armarAlerta, armarMail, TEXTOS, type MailArmado } from "@/lib/correo/plantillas";
import type { Mailer } from "@/lib/correo/resend";
import { cancelaMails } from "./estado";
import { nombresTarjetas } from "./experiencias";
import type { RepoLeads } from "./repo";
import type { Lead, MailEnCola } from "./tipos";

export const MAX_INTENTOS = 5;
export const POR_CORRIDA = 50;

export interface ConfigCola {
  /** URL pública del armador, sin barra final: https://lunallenatravel.vercel.app/armador */
  urlPublica: string;
  alertasEmail: string | null;
}

export interface DepsCola {
  repo: RepoLeads;
  crm: CrmSink;
  mailer: Mailer | null;
  ahora: () => Date;
  config: ConfigCola;
}

export interface ResumenCola {
  activo: boolean;
  revisados: number;
  enviados: number;
  cancelados: number;
  fallidos: number;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export const urlItinerario = (lead: Lead, base: string) =>
  lead.itinerarioSlug ? `${base}/itinerario/${lead.itinerarioSlug}/?l=${lead.id}` : `${base}/?l=${lead.id}`;
/** Página intermedia que marca wa_abierto y abre WhatsApp (ver /api/lead/[id]/wa). */
export const urlWhatsappMail = (lead: Lead, base: string) => `${base}/api/lead/${lead.id}/wa/`;

export function resumenViaje(lead: Lead): string {
  const r = lead.respuestas;
  return [`${r.viajeros >= 6 ? "6 o más" : r.viajeros} viajeros`, `${r.dias} días`, MESES[r.mes - 1], nombresTarjetas(r.experiencias).join(", ")].join(" · ");
}

/** Arma el mail (o null si no corresponde mandarlo) y a quién va. */
export function prepararMail(m: MailEnCola, lead: Lead, config: ConfigCola): { para: string; mail: MailArmado } | { omitir: string } {
  if (m.plantilla === "alerta_sin_contacto" || m.plantilla === "alerta_subio_score") {
    if (!config.alertasEmail) return { omitir: "sin ALERTAS_EMAIL" };
    if (m.plantilla === "alerta_sin_contacto" && (lead.grupo !== "calificado" || cancelaMails(lead.estado))) return { omitir: "ya no corresponde" };
    return {
      para: config.alertasEmail,
      mail: armarAlerta({
        motivo: m.plantilla === "alerta_sin_contacto" ? "sin_contacto" : "subio_score",
        nombre: lead.nombre,
        email: lead.email,
        whatsapp: lead.whatsapp,
        codigo: lead.codigo,
        score: lead.scoreTotal,
        grupo: lead.grupo,
        resumen: resumenViaje(lead),
        comentario: lead.respuestas.comentario ?? "",
        creadoEn: lead.creadoEn,
      }),
    };
  }
  if (!(m.plantilla in TEXTOS)) return { omitir: `plantilla desconocida: ${m.plantilla}` };
  const conWhatsapp = m.plantilla === "mail_5_whatsapp" || lead.grupo === "calificado";
  return {
    para: lead.email,
    mail: armarMail(m.plantilla as keyof typeof TEXTOS, {
      nombre: lead.nombre,
      dias: lead.respuestas.dias,
      ruta: nombresTarjetas(lead.respuestas.experiencias).join(", "),
      precioDesdeUsd: lead.precioDesde,
      codigo: lead.codigo,
      urlItinerario: urlItinerario(lead, config.urlPublica),
      urlWhatsapp: conWhatsapp ? urlWhatsappMail(lead, config.urlPublica) : null,
    }),
  };
}

export async function procesarCola(deps: DepsCola): Promise<ResumenCola> {
  const resumen: ResumenCola = { activo: !!deps.mailer, revisados: 0, enviados: 0, cancelados: 0, fallidos: 0 };
  // Sin Resend configurado no se toca la cola: los mails esperan hasta que haya clave.
  if (!deps.mailer) return resumen;

  const vencidos = await deps.repo.mailsVencidos(deps.ahora(), POR_CORRIDA);
  for (const m of vencidos) {
    resumen.revisados++;
    const lead = await deps.repo.obtenerLead(m.leadId);
    if (!lead || cancelaMails(lead.estado)) {
      await deps.repo.marcarMailFallido(m.id, lead ? `lead ${lead.estado}` : "lead no existe", true);
      resumen.cancelados++;
      continue;
    }
    const preparado = prepararMail(m, lead, deps.config);
    if ("omitir" in preparado) {
      await deps.repo.marcarMailFallido(m.id, preparado.omitir, true);
      resumen.cancelados++;
      continue;
    }
    if (!(await deps.repo.tomarMail(m.id, m.intentos))) continue; // lo tomó otra corrida

    try {
      const { id } = await deps.mailer.enviar({ para: preparado.para, ...preparado.mail, etiquetas: { lead_id: lead.id, mail_id: String(m.id), plantilla: m.plantilla } });
      await deps.repo.marcarMailEnviado(m.id, id, deps.ahora());
      const interno = m.plantilla.startsWith("alerta_");
      const ev = { leadId: lead.id, tipo: interno ? ("alerta" as const) : ("mail_enviado" as const), payload: { mailId: m.id, plantilla: m.plantilla, resendId: id } };
      await deps.repo.registrarEvento(ev);
      try {
        await deps.crm.logEvento(ev);
      } catch (e) {
        console.error("CRM:", e);
      }
      resumen.enviados++;
    } catch (e) {
      const ultimo = m.intentos + 1 >= MAX_INTENTOS;
      await deps.repo.marcarMailFallido(m.id, (e as Error).message, ultimo);
      resumen.fallidos++;
      if (ultimo) resumen.cancelados++;
    }
  }
  return resumen;
}

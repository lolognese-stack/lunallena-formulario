// Score vivo: puntos que se suman al score guardado después de crear el lead.
//   - Clic en un mail (webhook de Resend):       +5, máximo una vez por mail.
//   - Vuelve al armador (link del mail con ?l=):  +10, máximo una vez por día (hora de Lima).
// Si un no_calificado llega a 60 pasa a calificado y se encola una alerta al equipo; la cola
// pone el botón de WhatsApp en los mails que siguen. Las reglas duras de no_calificado no se
// revierten. Cada suma queda como evento cambio_score.

import type { CrmSink } from "@/lib/crm/sink";
import { acotarTotal, tieneReglaNoCalificado, UMBRAL_CALIFICADO } from "@/lib/scoring/v2";
import { cancelaMails } from "./estado";
import type { RepoLeads } from "./repo";
import type { Evento } from "./tipos";

export const PUNTOS_VIVOS = { mail_clic: 5, visita: 10 } as const;
export type MotivoVivo = keyof typeof PUNTOS_VIVOS;

export interface DepsVivo {
  repo: RepoLeads;
  crm: CrmSink;
  ahora: () => Date;
}

export interface ResultadoVivo {
  aplicado: boolean;
  motivo?: string;
  total?: number;
  pasoACalificado?: boolean;
}

/** Fecha en Lima (YYYY-MM-DD): la clave del "una vez por día" de las visitas. */
export function diaEnLima(fecha: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).format(fecha);
}

async function seguro(f: () => Promise<unknown>) {
  try {
    await f();
  } catch (e) {
    console.error("CRM:", e);
  }
}

/** Suma puntos una sola vez por (motivo, clave). */
export async function sumarPuntos(leadId: string, motivo: MotivoVivo, clave: string, deps: DepsVivo): Promise<ResultadoVivo> {
  const lead = await deps.repo.obtenerLead(leadId);
  if (!lead) return { aplicado: false, motivo: "lead_no_existe" };

  const eventos = await deps.repo.listarEventos(leadId);
  const repetido = eventos.some((e) => e.tipo === "cambio_score" && e.payload.motivo === motivo && e.payload.clave === clave);
  if (repetido) return { aplicado: false, motivo: "ya_sumado", total: lead.scoreTotal };

  const puntos = PUNTOS_VIVOS[motivo];
  const total = acotarTotal(lead.scoreTotal + puntos);
  const desglose = { ...lead.scoreDesglose, vivo: (lead.scoreDesglose.vivo ?? 0) + (total - lead.scoreTotal) };
  const pasaACalificado = lead.grupo === "no_calificado" && total >= UMBRAL_CALIFICADO && !tieneReglaNoCalificado(lead.reglasAplicadas);

  await deps.repo.actualizarLead(leadId, { scoreTotal: total, scoreDesglose: desglose, ...(pasaACalificado && { grupo: "calificado" as const }) });
  const ev: Evento = {
    leadId,
    tipo: "cambio_score",
    payload: { motivo, clave, puntos, desde: lead.scoreTotal, hasta: total, ...(pasaACalificado && { grupo: { desde: "no_calificado", hasta: "calificado" } }) },
  };
  await deps.repo.registrarEvento(ev);
  await seguro(() => deps.crm.logEvento(ev));

  if (pasaACalificado) {
    // Alerta al equipo, salvo que ya lo estén atendiendo.
    if (!cancelaMails(lead.estado)) await deps.repo.encolarMails([{ leadId, plantilla: "alerta_subio_score", enviarEn: deps.ahora() }]);
    const actualizado = await deps.repo.obtenerLead(leadId);
    if (actualizado) await seguro(() => deps.crm.upsertLead(actualizado));
  }
  return { aplicado: true, total, pasoACalificado: pasaACalificado };
}

/** El lead volvió al armador desde un link del mail. Registra la visita siempre; suma una vez por día. */
export async function registrarVisita(leadId: string, deps: DepsVivo): Promise<ResultadoVivo> {
  const lead = await deps.repo.obtenerLead(leadId);
  if (!lead) return { aplicado: false, motivo: "lead_no_existe" };
  const ev: Evento = { leadId, tipo: "visita", payload: {} };
  await deps.repo.registrarEvento(ev);
  await seguro(() => deps.crm.logEvento(ev));
  return sumarPuntos(leadId, "visita", diaEnLima(deps.ahora()), deps);
}

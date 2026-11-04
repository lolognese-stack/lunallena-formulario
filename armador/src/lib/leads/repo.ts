// Acceso a datos de leads. Dos implementaciones con la misma interfaz:
//   - Supabase (producción): tablas de supabase/migraciones/001_leads_v2.sql.
//   - Memoria (tests y desarrollo sin SUPABASE_SECRET_KEY).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Estado, Evento, Lead, LeadNuevo, MailEnCola } from "./tipos";

export interface MailNuevo {
  leadId: string;
  plantilla: string;
  enviarEn: Date;
}

export interface RepoLeads {
  crearLead(datos: LeadNuevo): Promise<Lead>;
  obtenerLead(id: string): Promise<Lead | null>;
  /** El lead más reciente con esa huella creado desde `desde`. */
  buscarPorHuella(huella: string, desde: Date): Promise<Lead | null>;
  actualizarLead(id: string, cambios: Partial<Pick<Lead, "estado" | "scoreTotal" | "grupo" | "scoreDesglose">>): Promise<void>;
  registrarEvento(evento: Evento): Promise<void>;
  listarEventos(leadId: string): Promise<Evento[]>;
  encolarMails(mails: MailNuevo[]): Promise<void>;
  listarMails(leadId: string): Promise<MailEnCola[]>;
  /** Cancela los mails pendientes del lead. Devuelve cuántos canceló. */
  cancelarMailsPendientes(leadId: string): Promise<number>;
  /** Mails pendientes con enviar_en <= ahora, los más viejos primero. */
  mailsVencidos(ahora: Date, limite: number): Promise<MailEnCola[]>;
  registrarIntentoIp(ipHash: string): Promise<void>;
  contarIntentosIp(ipHash: string, desde: Date): Promise<number>;
}

// ---------- Memoria ----------

export class RepoMemoria implements RepoLeads {
  leads = new Map<string, Lead>();
  eventos: Evento[] = [];
  mails: MailEnCola[] = [];
  intentos: { ipHash: string; creadoEn: Date }[] = [];
  private secuencia = 0;

  constructor(private reloj: () => Date = () => new Date()) {}

  async crearLead(datos: LeadNuevo): Promise<Lead> {
    if ([...this.leads.values()].some((l) => l.codigo === datos.codigo)) throw Object.assign(new Error("codigo duplicado"), { code: "23505" });
    const lead: Lead = { ...datos, id: `lead-${++this.secuencia}`, creadoEn: this.reloj().toISOString(), estado: datos.estado ?? "nuevo" };
    this.leads.set(lead.id, lead);
    return structuredClone(lead);
  }
  async obtenerLead(id: string) {
    const l = this.leads.get(id);
    return l ? structuredClone(l) : null;
  }
  async buscarPorHuella(huella: string, desde: Date) {
    const l = [...this.leads.values()].filter((x) => x.huella === huella && new Date(x.creadoEn) >= desde).sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))[0];
    return l ? structuredClone(l) : null;
  }
  async actualizarLead(id: string, cambios: Partial<Lead>) {
    const l = this.leads.get(id);
    if (l) this.leads.set(id, { ...l, ...cambios });
  }
  async registrarEvento(e: Evento) {
    this.eventos.push({ ...e, id: this.eventos.length + 1, creadoEn: this.reloj().toISOString() });
  }
  async listarEventos(leadId: string) {
    return this.eventos.filter((e) => e.leadId === leadId);
  }
  async encolarMails(mails: MailNuevo[]) {
    for (const m of mails) this.mails.push({ id: this.mails.length + 1, leadId: m.leadId, plantilla: m.plantilla, enviarEn: m.enviarEn.toISOString(), estado: "pendiente", intentos: 0 });
  }
  async listarMails(leadId: string) {
    return this.mails.filter((m) => m.leadId === leadId);
  }
  async cancelarMailsPendientes(leadId: string) {
    let n = 0;
    for (const m of this.mails) if (m.leadId === leadId && m.estado === "pendiente") (m.estado = "cancelado"), n++;
    return n;
  }
  async mailsVencidos(ahora: Date, limite: number) {
    return this.mails.filter((m) => m.estado === "pendiente" && new Date(m.enviarEn) <= ahora).sort((a, b) => a.enviarEn.localeCompare(b.enviarEn)).slice(0, limite);
  }
  async registrarIntentoIp(ipHash: string) {
    this.intentos.push({ ipHash, creadoEn: this.reloj() });
  }
  async contarIntentosIp(ipHash: string, desde: Date) {
    return this.intentos.filter((i) => i.ipHash === ipHash && i.creadoEn >= desde).length;
  }
}

// ---------- Supabase ----------

type Fila = Record<string, unknown>;

const aFila = (l: LeadNuevo): Fila => ({
  codigo: l.codigo,
  nombre: l.nombre,
  email: l.email,
  whatsapp: l.whatsapp,
  whatsapp_crudo: l.whatsappCrudo,
  respuestas: l.respuestas,
  score_total: l.scoreTotal,
  score_desglose: l.scoreDesglose,
  reglas_aplicadas: l.reglasAplicadas,
  score_version: l.scoreVersion,
  grupo: l.grupo,
  vio_puente: l.vioPuente,
  preguntas_puente: l.preguntasPuente,
  respuestas_puente: l.respuestasPuente,
  precio_desde: l.precioDesde,
  itinerario_slug: l.itinerarioSlug,
  utm: l.utm,
  referrer: l.referrer,
  estado: l.estado ?? "nuevo",
  huella: l.huella,
  ip_hash: l.ipHash,
});

const deFila = (f: Fila): Lead => ({
  id: f.id as string,
  codigo: f.codigo as string,
  creadoEn: f.creado_en as string,
  nombre: f.nombre as string,
  email: f.email as string,
  whatsapp: (f.whatsapp as string) ?? null,
  whatsappCrudo: (f.whatsapp_crudo as string) ?? null,
  respuestas: f.respuestas as Lead["respuestas"],
  scoreTotal: f.score_total as number,
  scoreDesglose: f.score_desglose as Lead["scoreDesglose"],
  reglasAplicadas: (f.reglas_aplicadas as Lead["reglasAplicadas"]) ?? [],
  scoreVersion: f.score_version as string,
  grupo: f.grupo as Lead["grupo"],
  vioPuente: f.vio_puente as boolean,
  preguntasPuente: (f.preguntas_puente as Lead["preguntasPuente"]) ?? [],
  respuestasPuente: (f.respuestas_puente as Lead["respuestasPuente"]) ?? {},
  precioDesde: f.precio_desde === null || f.precio_desde === undefined ? null : Number(f.precio_desde),
  itinerarioSlug: (f.itinerario_slug as string) ?? null,
  utm: (f.utm as Lead["utm"]) ?? {},
  referrer: (f.referrer as string) ?? null,
  estado: f.estado as Estado,
  huella: f.huella as string,
  ipHash: (f.ip_hash as string) ?? null,
});

const deMail = (f: Fila): MailEnCola => ({
  id: f.id as number,
  leadId: f.lead_id as string,
  plantilla: f.plantilla as string,
  enviarEn: f.enviar_en as string,
  estado: f.estado as MailEnCola["estado"],
  intentos: f.intentos as number,
});

function falla(error: { message: string; code?: string } | null, que: string) {
  if (error) throw Object.assign(new Error(`${que}: ${error.message}`), { code: error.code });
}

export class RepoSupabase implements RepoLeads {
  // Las tablas nuevas no están en database.types.ts (generado antes de la migración).
  constructor(private db: SupabaseClient) {}

  async crearLead(datos: LeadNuevo) {
    const { data, error } = await this.db.from("lead").insert(aFila(datos)).select("*").single();
    falla(error, "No se pudo guardar el lead");
    return deFila(data as Fila);
  }
  async obtenerLead(id: string) {
    const { data, error } = await this.db.from("lead").select("*").eq("id", id).maybeSingle();
    if (error?.code === "22P02") return null; // id que no es uuid
    falla(error, "No se pudo leer el lead");
    return data ? deFila(data as Fila) : null;
  }
  async buscarPorHuella(huella: string, desde: Date) {
    const { data, error } = await this.db.from("lead").select("*").eq("huella", huella).gte("creado_en", desde.toISOString()).order("creado_en", { ascending: false }).limit(1).maybeSingle();
    falla(error, "No se pudo buscar el lead");
    return data ? deFila(data as Fila) : null;
  }
  async actualizarLead(id: string, cambios: Partial<Pick<Lead, "estado" | "scoreTotal" | "grupo" | "scoreDesglose">>) {
    const fila: Fila = {};
    if (cambios.estado) fila.estado = cambios.estado;
    if (cambios.scoreTotal !== undefined) fila.score_total = cambios.scoreTotal;
    if (cambios.grupo) fila.grupo = cambios.grupo;
    if (cambios.scoreDesglose) fila.score_desglose = cambios.scoreDesglose;
    const { error } = await this.db.from("lead").update(fila).eq("id", id);
    falla(error, "No se pudo actualizar el lead");
  }
  async registrarEvento(e: Evento) {
    const { error } = await this.db.from("evento").insert({ lead_id: e.leadId, tipo: e.tipo, payload: e.payload });
    falla(error, "No se pudo registrar el evento");
  }
  async listarEventos(leadId: string) {
    const { data, error } = await this.db.from("evento").select("*").eq("lead_id", leadId).order("creado_en");
    falla(error, "No se pudieron leer los eventos");
    return (data ?? []).map((f: Fila) => ({ id: f.id as number, leadId: f.lead_id as string, tipo: f.tipo as Evento["tipo"], payload: f.payload as Evento["payload"], creadoEn: f.creado_en as string }));
  }
  async encolarMails(mails: MailNuevo[]) {
    if (!mails.length) return;
    const { error } = await this.db.from("mail_cola").insert(mails.map((m) => ({ lead_id: m.leadId, plantilla: m.plantilla, enviar_en: m.enviarEn.toISOString() })));
    falla(error, "No se pudieron encolar los mails");
  }
  async listarMails(leadId: string) {
    const { data, error } = await this.db.from("mail_cola").select("*").eq("lead_id", leadId).order("enviar_en");
    falla(error, "No se pudieron leer los mails");
    return (data ?? []).map(deMail);
  }
  async cancelarMailsPendientes(leadId: string) {
    const { data, error } = await this.db.from("mail_cola").update({ estado: "cancelado" }).eq("lead_id", leadId).eq("estado", "pendiente").select("id");
    falla(error, "No se pudieron cancelar los mails");
    return data?.length ?? 0;
  }
  async mailsVencidos(ahora: Date, limite: number) {
    const { data, error } = await this.db.from("mail_cola").select("*").eq("estado", "pendiente").lte("enviar_en", ahora.toISOString()).order("enviar_en").limit(limite);
    falla(error, "No se pudo leer la cola de mails");
    return (data ?? []).map(deMail);
  }
  async registrarIntentoIp(ipHash: string) {
    const { error } = await this.db.from("intento_ip").insert({ ip_hash: ipHash });
    falla(error, "No se pudo registrar el intento");
  }
  async contarIntentosIp(ipHash: string, desde: Date) {
    const { count, error } = await this.db.from("intento_ip").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("creado_en", desde.toISOString());
    falla(error, "No se pudo contar los intentos");
    return count ?? 0;
  }
}

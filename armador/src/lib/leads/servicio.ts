// Lógica de los endpoints del armador v2. Sin Next ni variables de entorno: todo entra por
// `deps`, así se prueba con RepoMemoria y un reloj fijo (ver servicio.test.ts).

import { createHash, randomInt } from "node:crypto";
import type { CrmSink } from "@/lib/crm/sink";
import { pasosDe } from "@/lib/correo/secuencia";
import { buildItinerary, type Catalogo, type Itinerario, type Respuestas as RespuestasMotor } from "@/lib/motor";
import { scoreLead, scoreParcial, type PreguntaPuente, type Respuestas } from "@/lib/scoring/v2";
import { normalizarWhatsapp } from "@/lib/scoring/whatsapp";
import { esquemaLead, esquemaScoreParcial } from "./esquema";
import { cancelaMails, puedeAvanzar } from "./estado";
import { nombresTarjetas, respuestasMotor } from "./experiencias";
import type { RepoLeads } from "./repo";
import type { Estado, Evento, Lead } from "./tipos";

export interface ConfigLeads {
  /** Número de WhatsApp de la agencia, solo dígitos con código de país (ej. 51930299443). */
  numeroWhatsapp: string;
  /** Sal para hashear IPs y huellas. */
  sal: string;
  /** Soles por dólar, para pasar el precio "desde" del motor (soles) a USD. */
  solesPorUsd: number;
  /** Rate limit de /api/lead: intentos por IP dentro de la ventana. */
  limiteIp: number;
  ventanaIpMin: number;
  /** Idempotencia: mismo email + mismas respuestas dentro de esta ventana devuelve el mismo lead. */
  ventanaIdempotenciaMin: number;
}

export interface DepsLeads {
  repo: RepoLeads;
  crm: CrmSink;
  ahora: () => Date;
  catalogo: Catalogo;
  /** Guarda el itinerario (tabla itineraries) y devuelve su slug. */
  guardarItinerario: (motor: RespuestasMotor, itinerario: Itinerario) => Promise<string>;
  config: ConfigLeads;
}

export type Respuesta<T> = { status: number; body: T };

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** JSON con las claves ordenadas: mismas respuestas en otro orden dan la misma huella. */
function canonico(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonico).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v as object)
      .sort()
      .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${canonico((v as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

export const hashIp = (ip: string, sal: string) => sha256(`${sal}:ip:${ip}`);

/** Arma el itinerario con el motor y devuelve el precio "desde" por persona en USD. */
export function armarItinerario(r: Respuestas, deps: Pick<DepsLeads, "catalogo" | "config">) {
  const motor = respuestasMotor(r, deps.catalogo);
  const itinerario = buildItinerary(motor, deps.catalogo);
  const soles = itinerario.precio.porPersona;
  const precioDesdeUsd = soles > 0 ? Math.round((soles / deps.config.solesPorUsd) * 100) / 100 : null;
  return { motor, itinerario, precioDesdeUsd };
}

// ---------- POST /api/score-parcial ----------

export type CuerpoParcial = { zonaGris: boolean; preguntas: PreguntaPuente[] } | { error: string };

export function calcularParcial(entrada: unknown, deps: Pick<DepsLeads, "catalogo" | "config" | "ahora">): Respuesta<CuerpoParcial> {
  const v = esquemaScoreParcial.safeParse(entrada);
  if (!v.success) return { status: 400, body: { error: "invalido" } };
  const r = v.data.respuestas as Respuestas;
  const { precioDesdeUsd } = armarItinerario(r, deps);
  const p = scoreParcial(r, { hoy: deps.ahora(), precioDesdeUsd });
  // Solo lo que el front necesita: ni el puntaje ni el desglose salen del servidor.
  return { status: 200, body: { zonaGris: p.zonaGris, preguntas: p.preguntas } };
}

// ---------- POST /api/lead ----------

export type CuerpoLead = { leadId: string; grupo: Lead["grupo"]; whatsappUrl?: string } | { error: string };

/** Link de WhatsApp a la agencia con el mensaje prellenado (solo para calificados). */
export function urlWhatsapp(lead: Pick<Lead, "nombre" | "codigo" | "respuestas">, numero: string): string {
  const r = lead.respuestas;
  const viajeros = r.viajeros >= 6 ? "6 o más" : String(r.viajeros);
  const texto = [
    `Hola, soy ${lead.nombre}. Armé mi viaje en la web y quiero hablar con un asesor.`,
    `Viajeros: ${viajeros} · Días: ${r.dias} · Mes: ${MESES[r.mes - 1]}`,
    `Quiero vivir: ${nombresTarjetas(r.experiencias).join(", ")}`,
    `Código: ${lead.codigo}`,
  ].join("\n");
  return `https://wa.me/${numero.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`;
}

const LETRAS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // sin 0/O ni 1/I
const generarCodigo = () => `LL-${Array.from({ length: 5 }, () => LETRAS[randomInt(LETRAS.length)]).join("")}`;

async function seguro(que: string, f: () => Promise<unknown>) {
  try {
    await f();
  } catch (e) {
    console.error(`${que}:`, e);
  }
}

export async function crearLead(entrada: unknown, meta: { ip: string | null }, deps: DepsLeads): Promise<Respuesta<CuerpoLead>> {
  const v = esquemaLead.safeParse(entrada);
  if (!v.success) return { status: 400, body: { error: "invalido" } };
  const e = v.data;
  const ahora = deps.ahora();

  // Honeypot: el bot recibe una respuesta normal y no se guarda nada.
  if (e.empresa) return { status: 201, body: { leadId: crypto.randomUUID(), grupo: "no_calificado" } };

  // Rate limit por IP (hasheada).
  const ipHash = meta.ip ? hashIp(meta.ip, deps.config.sal) : null;
  if (ipHash) {
    const desde = new Date(ahora.getTime() - deps.config.ventanaIpMin * 60_000);
    if ((await deps.repo.contarIntentosIp(ipHash, desde)) >= deps.config.limiteIp) return { status: 429, body: { error: "demasiados_intentos" } };
    await deps.repo.registrarIntentoIp(ipHash);
  }

  const respuestas: Respuestas = {
    ...(e.respuestas as Omit<Respuestas, "comentario" | "whatsapp" | "puente">),
    comentario: e.comentario,
    whatsapp: e.contacto.whatsapp,
    puente: e.puente,
  };

  // Idempotencia: mismo email + mismas respuestas en la ventana → el mismo lead, sin mails nuevos.
  const huella = sha256(`${deps.config.sal}:${canonico({ email: e.contacto.email, respuestas })}`);
  const previo = await deps.repo.buscarPorHuella(huella, new Date(ahora.getTime() - deps.config.ventanaIdempotenciaMin * 60_000));
  if (previo) return { status: 200, body: cuerpoLead(previo, deps.config.numeroWhatsapp) };

  // Todo se recalcula de cero en el servidor.
  const { motor, itinerario, precioDesdeUsd } = armarItinerario(respuestas, deps);
  const score = scoreLead(respuestas, { hoy: ahora, precioDesdeUsd });

  let itinerarioSlug: string | null = null;
  try {
    itinerarioSlug = await deps.guardarItinerario(motor, itinerario);
  } catch (err) {
    console.error("No se pudo guardar el itinerario del lead:", err);
  }

  const base = {
    nombre: e.contacto.nombre,
    email: e.contacto.email,
    whatsapp: normalizarWhatsapp(e.contacto.whatsapp),
    whatsappCrudo: e.contacto.whatsapp || null,
    respuestas,
    scoreTotal: score.total,
    scoreDesglose: score.desglose,
    reglasAplicadas: score.reglasAplicadas,
    scoreVersion: score.scoreVersion,
    grupo: score.grupo,
    vioPuente: score.vioPuente,
    preguntasPuente: score.preguntasMostradas,
    respuestasPuente: score.respuestasPuente,
    precioDesde: precioDesdeUsd,
    itinerarioSlug,
    utm: e.utm,
    referrer: e.referrer ?? null,
    huella,
    ipHash,
  };

  let lead: Lead | null = null;
  for (let intento = 0; intento < 5 && !lead; intento++) {
    try {
      lead = await deps.repo.crearLead({ ...base, codigo: generarCodigo() });
    } catch (err) {
      if ((err as { code?: string }).code !== "23505") throw err; // código repetido: se prueba otro
    }
  }
  if (!lead) throw new Error("No se pudo generar un código de lead único.");

  const envio: Evento = { leadId: lead.id, tipo: "envio", payload: { total: score.total, grupo: score.grupo, parcial: score.parcial, reglas: score.reglasAplicadas } };
  await deps.repo.registrarEvento(envio);
  await deps.repo.encolarMails(pasosDe(score.grupo).map((p) => ({ leadId: lead!.id, plantilla: p.plantilla, enviarEn: new Date(ahora.getTime() + p.minutos * 60_000) })));

  await seguro("CRM upsertLead", () => deps.crm.upsertLead(lead!));
  await seguro("CRM logEvento", () => deps.crm.logEvento(envio));

  return { status: 201, body: cuerpoLead(lead, deps.config.numeroWhatsapp) };
}

function cuerpoLead(lead: Lead, numero: string): CuerpoLead {
  return {
    leadId: lead.id,
    grupo: lead.grupo,
    ...(lead.grupo === "calificado" && { whatsappUrl: urlWhatsapp(lead, numero) }),
  };
}

// ---------- POST /api/lead/:id/wa-click ----------

export async function registrarClicWa(id: string, deps: Pick<DepsLeads, "repo" | "crm">): Promise<Respuesta<{ ok: true; estado: Estado } | { error: string }>> {
  const lead = await deps.repo.obtenerLead(id);
  if (!lead) return { status: 404, body: { error: "no_existe" } };
  let estado = lead.estado;
  if (puedeAvanzar(lead.estado, "wa_abierto")) {
    estado = "wa_abierto";
    await deps.repo.actualizarLead(id, { estado });
  }
  const ev: Evento = { leadId: id, tipo: "wa_click", payload: { estadoAnterior: lead.estado } };
  await deps.repo.registrarEvento(ev);
  await seguro("CRM logEvento", () => deps.crm.logEvento(ev));
  return { status: 200, body: { ok: true, estado } };
}

// ---------- Cambio de estado (lo usará el CRM; contactado o después cancela los mails) ----------

export async function cambiarEstado(id: string, nuevo: Estado, deps: Pick<DepsLeads, "repo" | "crm">): Promise<{ ok: boolean; cancelados: number }> {
  const lead = await deps.repo.obtenerLead(id);
  if (!lead || !puedeAvanzar(lead.estado, nuevo)) return { ok: false, cancelados: 0 };
  await deps.repo.actualizarLead(id, { estado: nuevo });
  const cancelados = cancelaMails(nuevo) ? await deps.repo.cancelarMailsPendientes(id) : 0;
  const ev: Evento = { leadId: id, tipo: "cambio_estado", payload: { desde: lead.estado, hasta: nuevo, mailsCancelados: cancelados } };
  await deps.repo.registrarEvento(ev);
  await seguro("CRM logEvento", () => deps.crm.logEvento(ev));
  return { ok: true, cancelados };
}

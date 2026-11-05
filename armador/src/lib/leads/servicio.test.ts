import { beforeEach, describe, expect, it, vi } from "vitest";
import { firmaSvixValida, firmarSvix, secretoCoincide } from "@/lib/correo/firma";
import type { CrmSink } from "@/lib/crm/sink";
import { catalogoPrueba } from "@/lib/motor/catalogo-prueba";
import { puedeAvanzar } from "./estado";
import { respuestasMotor, tarjetasOfrecidas, TARJETAS } from "./experiencias";
import { RepoMemoria } from "./repo";
import { armarItinerario, calcularParcial, cambiarEstado, crearLead, registrarClicWa, urlWhatsapp, type DepsLeads } from "./servicio";
import type { Estado } from "./tipos";
import { registrarEventoResend } from "./webhook";

const INICIO = new Date("2026-11-15T12:00:00Z");
let ahora: Date;
let repo: RepoMemoria;
let crm: CrmSink & { upsertLead: ReturnType<typeof vi.fn>; logEvento: ReturnType<typeof vi.fn> };
let deps: DepsLeads;

const CONFIG = { numeroWhatsapp: "51999888777", sal: "test", solesPorUsd: 3.75, limiteIp: 5, ventanaIpMin: 10, ventanaIdempotenciaMin: 10 };

beforeEach(() => {
  ahora = new Date(INICIO);
  repo = new RepoMemoria(() => ahora);
  crm = { upsertLead: vi.fn(async () => {}), logEvento: vi.fn(async () => {}) };
  deps = { repo, crm, ahora: () => ahora, catalogo: catalogoPrueba, config: CONFIG, guardarItinerario: async () => "slugPrueba" };
});

const avanzar = (min: number) => (ahora = new Date(ahora.getTime() + min * 60_000));

/** listo + vuelos comprados: calificado por regla dura. */
const CALIFICADO = {
  viajeros: 2,
  experiencias: ["machu-picchu", "cusco"],
  mes: 1,
  flexibilidad: "aproximadas",
  dias: "6-7",
  hotel: "estandar",
  presupuesto: "1000-1500",
  etapa: "listo",
  vuelos: "comprados",
};

/**
 * mirando + vuelos no. Con el catálogo de prueba (precio desde ≈ USD 587): mirando 4 + ratio 1,28 20
 * + ticket 1500 11 + enero 15 + vuelos 0 + 6-7 3 + estándar 3 = 56 → zona gris (pregunta "reserva").
 * Sin puente respondido queda no calificado.
 */
const NO_CALIFICADO = { ...CALIFICADO, presupuesto: "500-1000", etapa: "mirando", vuelos: "no" };

const cuerpo = (respuestas: object = CALIFICADO, extra: Record<string, unknown> = {}) => ({
  respuestas,
  contacto: { nombre: "Ana Torres", email: "Ana@Ejemplo.com", whatsapp: "+51 987 654 321" },
  comentario: "",
  utm: { source: "instagram", medium: "bio", campaign: "nov", content: "reel1" },
  referrer: "https://instagram.com/",
  ...extra,
});

describe("tarjetas del paso 2 y entrada del motor", () => {
  it("el catálogo de prueba ofrece todas las tarjetas definidas", () => {
    expect(tarjetasOfrecidas(catalogoPrueba).map((t) => t.id)).toEqual(TARJETAS.map((t) => t.id));
  });

  it("Camino Inca o Montaña de Colores → estilo aventura; si no, clásico", () => {
    const base = CALIFICADO as never;
    expect(respuestasMotor({ ...(base as object), experiencias: ["camino-inca"] } as never, catalogoPrueba).estilo).toBe("aventura");
    expect(respuestasMotor({ ...(base as object), experiencias: ["montana-colores", "lima"] } as never, catalogoPrueba).estilo).toBe("aventura");
    expect(respuestasMotor(base, catalogoPrueba).estilo).toBe("clasico");
  });

  it.each([
    ["4-5", 5],
    ["6-7", 7],
    ["8-10", 9],
    ["11+", 12],
  ])("rango %s → el motor usa %i días", (dias, n) => {
    expect(respuestasMotor({ ...CALIFICADO, dias } as never, catalogoPrueba).dias).toBe(n);
  });

  it("une destinos sin repetir", () => {
    expect(respuestasMotor({ ...CALIFICADO, experiencias: ["machu-picchu", "camino-inca", "colca"] } as never, catalogoPrueba).destinos).toEqual(["machu-picchu", "arequipa", "colca"]);
  });

  it("precio desde en USD = soles del motor / 3,75", () => {
    const { itinerario, precioDesdeUsd } = armarItinerario(CALIFICADO as never, deps);
    expect(precioDesdeUsd).toBeCloseTo(itinerario.precio.porPersona / 3.75, 2);
  });
});

describe("POST /api/score-parcial", () => {
  it("rechaza respuestas inválidas", () => {
    expect(calcularParcial({ respuestas: { ...CALIFICADO, viajeros: 9 } }, deps).status).toBe(400);
    expect(calcularParcial({ respuestas: { ...CALIFICADO, experiencias: ["amazonia"] } }, deps).status).toBe(400);
    expect(calcularParcial({ respuestas: { ...CALIFICADO, ocasion: "luna_miel", dias: 7 } }, deps).status).toBe(400);
    expect(calcularParcial(null, deps).status).toBe(400);
  });

  it("zona gris: devuelve preguntas y nunca el puntaje", () => {
    const r = calcularParcial({ respuestas: NO_CALIFICADO }, deps);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ zonaGris: true });
    expect((r.body as { preguntas: { id: string }[] }).preguntas.map((p) => p.id)).toEqual(["reserva"]);
    expect(Object.keys(r.body).sort()).toEqual(["preguntas", "vistaPrevia", "zonaGris"]);
    expect(JSON.stringify(r.body)).not.toMatch(/"total"|desglose|score/);
  });

  it("fuera de la zona gris: lista vacía", () => {
    const r = calcularParcial({ respuestas: CALIFICADO }, deps);
    expect(r.body).toMatchObject({ zonaGris: false, preguntas: [] });
  });

  it("vista previa: 2 días con detalle, el resto solo número y destino", () => {
    const v = (calcularParcial({ respuestas: CALIFICADO }, deps).body as unknown as { vistaPrevia: { totalDias: number; dias: Record<string, unknown>[] } }).vistaPrevia;
    expect(v.totalDias).toBe(7);
    expect(v.dias.filter((d) => d.visible).map((d) => d.numero)).toEqual([1, 2]);
    expect(v.dias[0]).toHaveProperty("tipo");
    for (const d of v.dias.slice(2)) expect(Object.keys(d).sort()).toEqual(["destino", "numero", "visible"]);
  });
});

describe("POST /api/lead", () => {
  it("calificado: guarda todo, recalcula el score, encola itinerario + alerta y devuelve WhatsApp", async () => {
    const r = await crearLead(cuerpo(CALIFICADO, { score: 3, grupo: "no_calificado", scoreTotal: 0 }), { ip: "1.2.3.4" }, deps);
    expect(r.status).toBe(201);
    const body = r.body as { leadId: string; grupo: string; whatsappUrl?: string };
    expect(body.grupo).toBe("calificado");
    expect(body.whatsappUrl).toMatch(/^https:\/\/wa\.me\/51999888777\?text=/);

    const lead = (await repo.obtenerLead(body.leadId))!;
    expect(lead).toMatchObject({
      nombre: "Ana Torres",
      email: "ana@ejemplo.com",
      whatsapp: "+51987654321",
      whatsappCrudo: "+51 987 654 321",
      grupo: "calificado",
      scoreVersion: "v2",
      reglasAplicadas: ["listo_con_vuelos"],
      estado: "nuevo",
      itinerarioSlug: "slugPrueba",
      utm: { source: "instagram", medium: "bio", campaign: "nov", content: "reel1" },
      referrer: "https://instagram.com/",
    });
    expect(lead.codigo).toMatch(/^LL-[2-9A-HJ-NP-Z]{5}$/);
    expect(lead.scoreDesglose.whatsapp).toBe(5);
    expect(lead.ipHash).toMatch(/^[0-9a-f]{64}$/);
    expect(lead.ipHash).not.toContain("1.2.3.4");
    expect(decodeURIComponent(body.whatsappUrl!)).toContain(lead.codigo);

    expect(repo.eventos.map((e) => e.tipo)).toEqual(["envio"]);
    expect((await repo.listarMails(lead.id)).map((m) => [m.plantilla, (new Date(m.enviarEn).getTime() - INICIO.getTime()) / 60_000])).toEqual([
      ["itinerario", 10],
      ["alerta_sin_contacto", 30],
    ]);
    expect(crm.upsertLead).toHaveBeenCalledOnce();
    expect(crm.logEvento).toHaveBeenCalledOnce();
  });

  it("no calificado: secuencia de 5 mails y sin WhatsApp", async () => {
    // Sin WhatsApp: 56 + 0. (Con un WhatsApp válido sumaría 5 y pasaría a 61, calificado.)
    const r = await crearLead({ ...cuerpo(NO_CALIFICADO), contacto: { nombre: "Beto", email: "beto@ejemplo.com", whatsapp: "" } }, { ip: null }, deps);
    const body = r.body as { leadId: string; grupo: string; whatsappUrl?: string };
    expect(body.grupo).toBe("no_calificado");
    expect((await repo.obtenerLead(body.leadId))!.scoreTotal).toBe(56);
    expect(body.whatsappUrl).toBeUndefined();
    const mails = await repo.listarMails(body.leadId);
    expect(mails.map((m) => [m.plantilla, (new Date(m.enviarEn).getTime() - INICIO.getTime()) / 60_000])).toEqual([
      ["itinerario", 10],
      ["mail_2", 1440],
      ["mail_3", 3 * 1440],
      ["mail_4", 5 * 1440],
      ["mail_5_whatsapp", 8 * 1440],
    ]);
  });

  it("las respuestas puente solo cuentan si el servidor mostró esa pregunta", async () => {
    const r = await crearLead(cuerpo(NO_CALIFICADO, { puente: { reserva: "este_mes", decide: "solo_yo" } }), { ip: null }, deps);
    const lead = (await repo.obtenerLead((r.body as { leadId: string }).leadId))!;
    expect(lead.vioPuente).toBe(true);
    expect(lead.preguntasPuente).toEqual(["reserva"]);
    expect(lead.respuestasPuente).toEqual({ reserva: "este_mes" });
    expect(lead.scoreDesglose.puente).toBe(10);
  });

  it("honeypot: responde normal y no guarda nada", async () => {
    const r = await crearLead(cuerpo(CALIFICADO, { empresa: "Spam SA" }), { ip: "1.2.3.4" }, deps);
    expect(r.status).toBe(201);
    expect(repo.leads.size).toBe(0);
    expect(repo.mails).toHaveLength(0);
    expect(repo.intentos).toHaveLength(0);
  });

  it.each([
    ["email inválido", { contacto: { nombre: "Ana", email: "ana@", whatsapp: "" } }],
    ["nombre corto", { contacto: { nombre: "A", email: "a@b.co", whatsapp: "" } }],
    ["experiencia desconocida", { respuestas: { ...CALIFICADO, experiencias: ["amazonia"] } }],
    ["sin experiencias", { respuestas: { ...CALIFICADO, experiencias: [] } }],
  ])("rechaza %s", async (_, cambios) => {
    const r = await crearLead({ ...cuerpo(), ...cambios }, { ip: null }, deps);
    expect(r.status).toBe(400);
    expect(repo.leads.size).toBe(0);
  });

  it("acepta WhatsApp inválido o vacío: se guarda sin normalizar y suma 0", async () => {
    const r = await crearLead({ ...cuerpo(), contacto: { nombre: "Ana", email: "a@b.co", whatsapp: "12345" } }, { ip: null }, deps);
    const lead = (await repo.obtenerLead((r.body as { leadId: string }).leadId))!;
    expect(lead.whatsapp).toBeNull();
    expect(lead.whatsappCrudo).toBe("12345");
    expect(lead.scoreDesglose.whatsapp).toBe(0);
  });

  it("rate limit: 5 intentos por IP cada 10 minutos", async () => {
    for (let i = 0; i < 5; i++) {
      const r = await crearLead({ ...cuerpo(), contacto: { nombre: "Ana", email: `a${i}@b.co`, whatsapp: "" } }, { ip: "9.9.9.9" }, deps);
      expect(r.status).toBe(201);
    }
    const sexto = await crearLead({ ...cuerpo(), contacto: { nombre: "Ana", email: "a6@b.co", whatsapp: "" } }, { ip: "9.9.9.9" }, deps);
    expect(sexto.status).toBe(429);
    expect((await crearLead({ ...cuerpo(), contacto: { nombre: "Ana", email: "otra@b.co", whatsapp: "" } }, { ip: "8.8.8.8" }, deps)).status).toBe(201);
    avanzar(11);
    expect((await crearLead({ ...cuerpo(), contacto: { nombre: "Ana", email: "a7@b.co", whatsapp: "" } }, { ip: "9.9.9.9" }, deps)).status).toBe(201);
  });

  it("idempotencia: mismo email + mismas respuestas en 10 min devuelve el mismo lead sin mails nuevos", async () => {
    const a = await crearLead(cuerpo(), { ip: null }, deps);
    avanzar(9);
    const b = await crearLead({ ...cuerpo(), contacto: { nombre: "Ana Torres", email: "ANA@ejemplo.com", whatsapp: "+51 987 654 321" } }, { ip: null }, deps);
    expect(b.status).toBe(200);
    expect(b.body).toEqual(a.body);
    expect(repo.leads.size).toBe(1);
    expect(repo.mails).toHaveLength(2);
  });

  it("idempotencia: pasados 10 min, o con otra respuesta, es un lead nuevo", async () => {
    await crearLead(cuerpo(), { ip: null }, deps);
    await crearLead(cuerpo({ ...CALIFICADO, hotel: "superior" }), { ip: null }, deps);
    expect(repo.leads.size).toBe(2);
    avanzar(11);
    await crearLead(cuerpo(), { ip: null }, deps);
    expect(repo.leads.size).toBe(3);
  });

  it("si no se puede guardar el itinerario, el lead igual se crea", async () => {
    deps.guardarItinerario = async () => {
      throw new Error("Supabase caído");
    };
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await crearLead(cuerpo(), { ip: null }, deps);
    expect(r.status).toBe(201);
    expect((await repo.obtenerLead((r.body as { leadId: string }).leadId))!.itinerarioSlug).toBeNull();
    err.mockRestore();
  });

  it("si el CRM falla, el lead igual se crea", async () => {
    crm.upsertLead.mockRejectedValueOnce(new Error("CRM caído"));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await crearLead(cuerpo(), { ip: null }, deps)).status).toBe(201);
    err.mockRestore();
  });
});

describe("mensaje de WhatsApp", () => {
  it("lleva nombre, viajeros, días, mes, destinos y código", () => {
    const url = urlWhatsapp({ nombre: "Ana", codigo: "LL-ABCDE", respuestas: { ...CALIFICADO, viajeros: 6, experiencias: ["camino-inca", "titicaca"] } as never }, "+51 930 299 443");
    expect(url.startsWith("https://wa.me/51930299443?text=")).toBe(true);
    const texto = decodeURIComponent(url.split("text=")[1]);
    expect(texto).toContain("soy Ana");
    expect(texto).toContain("Viajeros: 6 o más");
    expect(texto).toContain("Días: 6-7");
    expect(texto).toContain("Mes: enero");
    expect(texto).toContain("Camino Inca, Lago Titicaca");
    expect(texto).toContain("Código: LL-ABCDE");
  });
});

describe("POST /api/lead/:id/wa-click y estados", () => {
  const nuevoLead = async () => (await crearLead(cuerpo(), { ip: null }, deps)).body as { leadId: string };

  it("404 si no existe", async () => {
    expect((await registrarClicWa("nope", deps)).status).toBe(404);
  });

  it("nuevo → wa_abierto, registra el evento cada vez", async () => {
    const { leadId } = await nuevoLead();
    expect((await registrarClicWa(leadId, deps)).body).toEqual({ ok: true, estado: "wa_abierto" });
    expect((await registrarClicWa(leadId, deps)).body).toEqual({ ok: true, estado: "wa_abierto" });
    expect(repo.eventos.filter((e) => e.tipo === "wa_click")).toHaveLength(2);
  });

  it("no baja de contactado a wa_abierto", async () => {
    const { leadId } = await nuevoLead();
    await cambiarEstado(leadId, "contactado", deps);
    expect((await registrarClicWa(leadId, deps)).body).toEqual({ ok: true, estado: "contactado" });
  });

  it("contactado cancela los mails pendientes; no se puede volver atrás", async () => {
    const { leadId } = await nuevoLead();
    expect(await cambiarEstado(leadId, "contactado", deps)).toEqual({ ok: true, cancelados: 2 });
    expect((await repo.listarMails(leadId)).every((m) => m.estado === "cancelado")).toBe(true);
    expect(await cambiarEstado(leadId, "nuevo", deps)).toEqual({ ok: false, cancelados: 0 });
    expect(repo.eventos.at(-1)).toMatchObject({ tipo: "cambio_estado", payload: { desde: "nuevo", hasta: "contactado", mailsCancelados: 2 } });
  });

  it("wa_abierto no cancela mails", async () => {
    const { leadId } = await nuevoLead();
    await registrarClicWa(leadId, deps);
    expect((await repo.listarMails(leadId)).every((m) => m.estado === "pendiente")).toBe(true);
  });

  it.each([
    ["nuevo", "wa_abierto", true],
    ["nuevo", "contactado", true],
    ["wa_abierto", "nuevo", false],
    ["contactado", "wa_abierto", false],
    ["cotizado", "ganado", true],
    ["cotizado", "perdido", true],
    ["nuevo", "perdido", true],
    ["ganado", "perdido", false],
    ["perdido", "ganado", false],
    ["contactado", "contactado", false],
  ] as [Estado, Estado, boolean][])("%s → %s: %s", (a, b, ok) => {
    expect(puedeAvanzar(a, b)).toBe(ok);
  });
});

describe("webhook de Resend", () => {
  const SECRETO = `whsec_${Buffer.from("secreto-de-prueba-1234567890").toString("base64")}`;
  const ts = String(Math.floor(INICIO.getTime() / 1000));

  it("firma válida, secreto incorrecto, cuerpo alterado y timestamp viejo", () => {
    const body = JSON.stringify({ type: "email.clicked" });
    const firma = firmarSvix(body, "msg_1", ts, SECRETO);
    const h = { id: "msg_1", timestamp: ts, firma };
    expect(firmaSvixValida(body, h, SECRETO, INICIO.getTime())).toBe(true);
    expect(firmaSvixValida(body, { ...h, firma: `v1,xxx ${firma}` }, SECRETO, INICIO.getTime())).toBe(true); // varias firmas
    expect(firmaSvixValida(body, h, `whsec_${Buffer.from("otro").toString("base64")}`, INICIO.getTime())).toBe(false);
    expect(firmaSvixValida(body + " ", h, SECRETO, INICIO.getTime())).toBe(false);
    expect(firmaSvixValida(body, h, SECRETO, INICIO.getTime() + 301_000)).toBe(false);
    expect(firmaSvixValida(body, h, undefined, INICIO.getTime())).toBe(false);
    expect(firmaSvixValida(body, { ...h, id: null }, SECRETO, INICIO.getTime())).toBe(false);
  });

  it("registra el clic del lead de la etiqueta y suma +5; ignora el resto", async () => {
    const { leadId } = (await crearLead(cuerpo(), { ip: null }, deps)).body as { leadId: string };
    const tags = [{ name: "lead_id", value: leadId }, { name: "mail_id", value: "7" }];
    expect(await registrarEventoResend({ type: "email.clicked", data: { email_id: "re_1", tags, click: { link: "https://x" } } }, "msg_1", deps)).toEqual({ registrado: true, puntos: true });
    // El envío lo registra la cola, no el webhook.
    expect(await registrarEventoResend({ type: "email.sent", data: { tags: { lead_id: leadId } } }, "msg_2", deps)).toEqual({ registrado: false, motivo: "tipo_ignorado" });
    expect(await registrarEventoResend({ type: "email.opened", data: { tags } }, "msg_3", deps)).toEqual({ registrado: false, motivo: "tipo_ignorado" });
    expect(await registrarEventoResend({ type: "email.clicked", data: {} }, "msg_4", deps)).toEqual({ registrado: false, motivo: "sin_lead" });
    expect(await registrarEventoResend({ type: "email.clicked", data: { tags: { lead_id: "otro" } } }, "msg_5", deps)).toEqual({ registrado: false, motivo: "lead_no_existe" });
    expect(repo.eventos.filter((e) => e.leadId === leadId).map((e) => e.tipo)).toEqual(["envio", "mail_clic", "cambio_score"]);
    expect(repo.eventos.find((e) => e.tipo === "mail_clic")!.payload).toEqual({ mailId: "7", resendId: "re_1", link: "https://x", svixId: "msg_1" });
  });

  it("secreto del cron en tiempo constante", () => {
    expect(secretoCoincide("abc", "abc")).toBe(true);
    expect(secretoCoincide("abd", "abc")).toBe(false);
    expect(secretoCoincide("ab", "abc")).toBe(false);
    expect(secretoCoincide(null, "abc")).toBe(false);
    expect(secretoCoincide("abc", undefined)).toBe(false);
  });
});

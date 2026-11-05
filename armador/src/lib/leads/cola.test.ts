import { beforeEach, describe, expect, it, vi } from "vitest";
import { armarAlerta, armarMail, rellenar } from "@/lib/correo/plantillas";
import { mailerResend, type Envio, type Mailer } from "@/lib/correo/resend";
import type { CrmSink } from "@/lib/crm/sink";
import { catalogoPrueba } from "@/lib/motor/catalogo-prueba";
import { MAX_INTENTOS, procesarCola, type DepsCola } from "./cola";
import { RepoMemoria } from "./repo";
import { cambiarEstado, crearLead, type DepsLeads } from "./servicio";
import { diaEnLima, registrarVisita, sumarPuntos } from "./vivo";
import { registrarEventoResend } from "./webhook";

const INICIO = new Date("2026-11-15T12:00:00Z");
const BASE_URL = "https://lunallenatravel.vercel.app/armador";
let ahora: Date;
let repo: RepoMemoria;
let crm: CrmSink;
let enviados: Envio[];
let mailer: Mailer & { enviar: ReturnType<typeof vi.fn> };
let leads: DepsLeads;
let cola: DepsCola;

beforeEach(() => {
  ahora = new Date(INICIO);
  repo = new RepoMemoria(() => ahora);
  crm = { upsertLead: vi.fn(async () => {}), logEvento: vi.fn(async () => {}) };
  enviados = [];
  let n = 0;
  mailer = { enviar: vi.fn(async (e: Envio) => (enviados.push(e), { id: `re_${++n}` })) };
  const config = { numeroWhatsapp: "51999888777", sal: "t", solesPorUsd: 3.75, limiteIp: 5, ventanaIpMin: 10, ventanaIdempotenciaMin: 10 };
  leads = { repo, crm, ahora: () => ahora, catalogo: catalogoPrueba, config, guardarItinerario: async () => "slugPrueba" };
  cola = { repo, crm, mailer, ahora: () => ahora, config: { urlPublica: BASE_URL, alertasEmail: "equipo@luna.test" } };
});

const avanzar = (min: number) => (ahora = new Date(ahora.getTime() + min * 60_000));

const RESPUESTAS = { viajeros: 2, experiencias: ["machu-picchu", "cusco"], mes: 1, flexibilidad: "aproximadas", dias: "6-7", hotel: "estandar", presupuesto: "1000-1500" };
const CALIFICADO = { ...RESPUESTAS, etapa: "listo", vuelos: "comprados" };
// Zona gris, 56 sin WhatsApp (ver servicio.test.ts): no calificado.
const NO_CALIFICADO = { ...RESPUESTAS, presupuesto: "500-1000", etapa: "mirando", vuelos: "no" };

async function lead(respuestas: object, whatsapp = "") {
  const r = await crearLead({ respuestas, contacto: { nombre: "Ana Torres", email: "ana@ejemplo.com", whatsapp }, comentario: "" }, { ip: null }, leads);
  return (r.body as { leadId: string }).leadId;
}

describe("cola de mails", () => {
  it("sin Resend configurado no toca la cola", async () => {
    await lead(CALIFICADO);
    avanzar(60);
    expect(await procesarCola({ ...cola, mailer: null })).toEqual({ activo: false, revisados: 0, enviados: 0, cancelados: 0, fallidos: 0 });
    expect(repo.mails.every((m) => m.estado === "pendiente" && m.intentos === 0)).toBe(true);
  });

  it("mailerResend necesita RESEND_API_KEY y MAIL_FROM", () => {
    expect(mailerResend({})).toBeNull();
    expect(mailerResend({ RESEND_API_KEY: "re_x" })).toBeNull();
    expect(mailerResend({ RESEND_API_KEY: "re_x", MAIL_FROM: "a@b.co" })).not.toBeNull();
  });

  it("no manda nada antes de tiempo", async () => {
    await lead(CALIFICADO);
    avanzar(9);
    expect((await procesarCola(cola)).enviados).toBe(0);
  });

  it("calificado: mail 1 con WhatsApp a los 10 min y alerta al equipo a los 30 si nadie lo contactó", async () => {
    const id = await lead(CALIFICADO);
    avanzar(10);
    expect(await procesarCola(cola)).toMatchObject({ enviados: 1 });
    expect(enviados[0]).toMatchObject({ para: "ana@ejemplo.com", etiquetas: { lead_id: id, mail_id: "1", plantilla: "itinerario" } });
    expect(enviados[0].html).toContain(`${BASE_URL}/itinerario/slugPrueba/?l=${id}`);
    expect(enviados[0].html).toContain(`${BASE_URL}/api/lead/${id}/wa/`);
    expect(enviados[0].asunto).toBe("Ana, tu viaje de 6-7 días ya tiene ruta");

    avanzar(20);
    await procesarCola(cola);
    expect(enviados[1].para).toBe("equipo@luna.test");
    expect(enviados[1].asunto).toContain("nadie le escribió en 30 min");
    expect(repo.eventos.map((e) => e.tipo)).toEqual(["envio", "mail_enviado", "alerta"]);
    expect(repo.mails.map((m) => m.estado)).toEqual(["enviado", "enviado"]);
  });

  it("calificado contactado antes de los 30 min: no hay alerta", async () => {
    const id = await lead(CALIFICADO);
    avanzar(10);
    await procesarCola(cola);
    await cambiarEstado(id, "contactado", leads);
    avanzar(30);
    expect((await procesarCola(cola)).enviados).toBe(0);
    expect(enviados).toHaveLength(1);
  });

  it("wa_abierto no frena la alerta (solo contactado o después)", async () => {
    const id = await lead(CALIFICADO);
    await repo.actualizarLead(id, { estado: "wa_abierto" });
    avanzar(30);
    await procesarCola(cola);
    expect(enviados.map((e) => e.para)).toEqual(["ana@ejemplo.com", "equipo@luna.test"]);
  });

  it("sin ALERTAS_EMAIL la alerta se cancela con el motivo", async () => {
    await lead(CALIFICADO);
    avanzar(30);
    await procesarCola({ ...cola, config: { ...cola.config, alertasEmail: null } });
    expect(repo.mails[1]).toMatchObject({ estado: "cancelado", error: "sin ALERTAS_EMAIL" });
  });

  it("no calificado: 5 mails en sus días; WhatsApp solo en el mail 5", async () => {
    await lead(NO_CALIFICADO);
    for (const dia of [0, 1, 3, 5, 8]) {
      ahora = new Date(INICIO.getTime() + dia * 86_400_000 + 11 * 60_000);
      await procesarCola(cola);
    }
    expect(enviados.map((e) => e.etiquetas!.plantilla)).toEqual(["itinerario", "mail_2", "mail_3", "mail_4", "mail_5_whatsapp"]);
    expect(enviados.map((e) => e.html.includes("/wa/"))).toEqual([false, false, false, false, true]);
  });

  it("un error se reintenta en la próxima corrida y al quinto intento se cancela", async () => {
    await lead(CALIFICADO);
    mailer.enviar.mockRejectedValue(new Error("Resend 500"));
    avanzar(10);
    for (let i = 1; i <= MAX_INTENTOS; i++) {
      const r = await procesarCola(cola);
      expect(r.fallidos).toBe(1);
      expect(repo.mails[0].intentos).toBe(i);
    }
    expect(repo.mails[0]).toMatchObject({ estado: "cancelado", error: "Resend 500" });
    expect((await procesarCola(cola)).revisados).toBe(0);
  });

  it("dos corridas a la vez no mandan el mismo mail dos veces", async () => {
    await lead(CALIFICADO);
    avanzar(10);
    await Promise.all([procesarCola(cola), procesarCola(cola)]);
    expect(enviados).toHaveLength(1);
  });

  it("cancela los mails de un lead que ya está contactado", async () => {
    const id = await lead(NO_CALIFICADO);
    await repo.actualizarLead(id, { estado: "cotizado" }); // sin pasar por cambiarEstado
    avanzar(10);
    expect(await procesarCola(cola)).toMatchObject({ enviados: 0, cancelados: 1 });
  });
});

describe("score vivo", () => {
  it("clic en un mail: +5 una sola vez por mail", async () => {
    const id = await lead(NO_CALIFICADO);
    const clic = (mailId: string, svix: string) => registrarEventoResend({ type: "email.clicked", data: { tags: { lead_id: id, mail_id: mailId } } }, svix, cola);
    await clic("1", "a");
    await clic("1", "b"); // segundo clic en el mismo mail
    await clic("2", "c");
    expect((await repo.obtenerLead(id))!.scoreTotal).toBe(66);
    expect(repo.eventos.filter((e) => e.tipo === "mail_clic")).toHaveLength(3);
    expect(repo.eventos.filter((e) => e.tipo === "cambio_score").map((e) => e.payload.puntos)).toEqual([5, 5]);
  });

  it("visita: +10 una vez por día (hora de Lima)", async () => {
    const id = await lead(NO_CALIFICADO);
    await registrarVisita(id, cola);
    avanzar(60);
    await registrarVisita(id, cola);
    expect((await repo.obtenerLead(id))!.scoreTotal).toBe(66);
    ahora = new Date("2026-11-16T05:30:00Z"); // 00:30 del 16 en Lima
    await registrarVisita(id, cola);
    expect((await repo.obtenerLead(id))!.scoreTotal).toBe(76);
    expect(repo.eventos.filter((e) => e.tipo === "visita")).toHaveLength(3);
  });

  it("día en Lima", () => {
    expect(diaEnLima(new Date("2026-11-16T04:59:00Z"))).toBe("2026-11-15");
    expect(diaEnLima(new Date("2026-11-16T05:00:00Z"))).toBe("2026-11-16");
  });

  it("no calificado que cruza 60 → calificado, alerta al equipo y WhatsApp en el mail siguiente", async () => {
    const id = await lead(NO_CALIFICADO); // 56
    avanzar(11);
    await procesarCola(cola); // mail 1 sin WhatsApp
    expect(enviados[0].html).not.toContain("/wa/");

    const r = await registrarVisita(id, cola); // 66
    expect(r).toMatchObject({ aplicado: true, total: 66, pasoACalificado: true });
    expect((await repo.obtenerLead(id))!.grupo).toBe("calificado");
    expect(repo.eventos.find((e) => e.tipo === "cambio_score")!.payload.grupo).toEqual({ desde: "no_calificado", hasta: "calificado" });

    await procesarCola(cola); // alerta inmediata
    expect(enviados[1]).toMatchObject({ para: "equipo@luna.test" });
    expect(enviados[1].asunto).toContain("pasó a calificado");

    ahora = new Date(INICIO.getTime() + 86_400_000 + 60_000);
    await procesarCola(cola); // mail 2, ahora con WhatsApp
    expect(enviados[2].etiquetas!.plantilla).toBe("mail_2");
    expect(enviados[2].html).toContain(`/api/lead/${id}/wa/`);
    expect(crm.upsertLead).toHaveBeenCalledTimes(2);
  });

  it("las reglas duras de no calificado no se revierten con score vivo", async () => {
    // ratio < 0,50: "Menos de USD 500" con un viaje largo y hotel superior (precio desde > USD 800).
    const id = await lead({ ...NO_CALIFICADO, experiencias: ["camino-inca", "titicaca", "colca"], dias: "11+", hotel: "superior", presupuesto: "lt500", etapa: "listo", vuelos: "comprados" }, "+51987654321");
    const antes = (await repo.obtenerLead(id))!;
    expect(antes.reglasAplicadas).toContain("presupuesto_menor_50");
    expect(antes.scoreTotal).toBeGreaterThanOrEqual(50);
    for (let d = 0; d < 5; d++) {
      ahora = new Date(INICIO.getTime() + d * 86_400_000);
      await registrarVisita(id, cola);
    }
    const despues = (await repo.obtenerLead(id))!;
    expect(despues.scoreTotal).toBe(100);
    expect(despues.grupo).toBe("no_calificado");
    expect(repo.mails.some((m) => m.plantilla === "alerta_subio_score")).toBe(false);
  });

  it("tope 100", async () => {
    const id = await lead(CALIFICADO, "+51987654321");
    await repo.actualizarLead(id, { scoreTotal: 98 });
    await sumarPuntos(id, "visita", "2026-11-15", cola);
    expect((await repo.obtenerLead(id))!.scoreTotal).toBe(100);
    expect(repo.eventos.at(-1)!.payload).toMatchObject({ desde: 98, hasta: 100, puntos: 10 });
  });

  it("lead que no existe", async () => {
    expect(await registrarVisita("nope", cola)).toEqual({ aplicado: false, motivo: "lead_no_existe" });
  });
});

describe("plantillas", () => {
  const datos = { nombre: "Ana Torres", dias: "8-10", ruta: "Machu Picchu, Camino Inca", precioDesdeUsd: 612.4, codigo: "LL-ABCDE", urlItinerario: "https://x/i?l=1", urlWhatsapp: null };

  it("rellena marcadores y escapa HTML", () => {
    expect(rellenar("Hola {nombre}, {nada}", { nombre: "<b>" }, true)).toBe("Hola &lt;b&gt;, {nada}");
    const m = armarMail("itinerario", { ...datos, nombre: "<script>" });
    expect(m.html).not.toContain("<script>");
  });

  it("mail 1: asunto, precio y link; sin WhatsApp si no corresponde", () => {
    const m = armarMail("itinerario", datos);
    expect(m.asunto).toBe("Ana, tu viaje de 8-10 días ya tiene ruta");
    expect(m.html).toContain("USD 612");
    expect(m.html).toContain("https://x/i?l=1");
    expect(m.html).not.toContain("Escribir por WhatsApp");
    expect(m.texto).toContain("Tu itinerario: https://x/i?l=1");
  });

  it("con urlWhatsapp lleva el botón verde", () => {
    const m = armarMail("mail_2", { ...datos, urlWhatsapp: "https://x/wa/" });
    expect(m.html).toContain("https://x/wa/");
    expect(m.html).toContain("#25D366");
  });

  it("alerta interna con los datos del lead y su WhatsApp", () => {
    const a = armarAlerta({ motivo: "sin_contacto", nombre: "Ana", email: "a@b.co", whatsapp: "+51987654321", codigo: "LL-ABCDE", score: 72, grupo: "calificado", resumen: "2 viajeros", comentario: "", creadoEn: "x" });
    expect(a.asunto).toContain("LL-ABCDE");
    expect(a.html).toContain("https://wa.me/51987654321");
    expect(a.texto).toContain("Score: 72 · calificado");
  });
});

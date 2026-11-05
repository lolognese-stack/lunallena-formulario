import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { RepoConRespaldo, RepoMemoria, type RepoLeads } from "./repo";
import type { LeadNuevo } from "./tipos";

const LEAD: LeadNuevo = {
  codigo: "LL-ABCDE", nombre: "Ana", email: "a@b.co", whatsapp: "+51987654321", whatsappCrudo: "+51 987 654 321",
  respuestas: { viajeros: 2, experiencias: ["machu-picchu"], mes: 1, flexibilidad: "flexible", dias: "6-7", hotel: "estandar", presupuesto: "nose", etapa: "listo", vuelos: "comprados" },
  scoreTotal: 61, scoreDesglose: { etapa: 20 }, reglasAplicadas: ["listo_con_vuelos"], scoreVersion: "v2", grupo: "calificado",
  vioPuente: false, preguntasPuente: [], respuestasPuente: {}, precioDesde: 587, itinerarioSlug: "slug", utm: { source: "ig" }, referrer: null, huella: "h", ipHash: null,
};

/** Repositorio cuyas tablas no existen: todo tira PGRST205. */
const sinTablas = () =>
  new Proxy({}, { get: () => async () => { throw Object.assign(new Error("Could not find the table"), { code: "PGRST205" }); } }) as RepoLeads;

function dbFalso() {
  const insert = vi.fn(() => ({ select: () => ({ single: async () => ({ data: { id: "q-1", created_at: "2026-11-05T00:00:00Z" }, error: null }) }) }));
  return { db: { from: vi.fn(() => ({ insert })) } as unknown as SupabaseClient, insert };
}

describe("respaldo sin tablas v2", () => {
  it("guarda el lead en quote_requests con todo el detalle", async () => {
    const { db, insert } = dbFalso();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const lead = await new RepoConRespaldo(sinTablas(), db).crearLead(LEAD);
    expect(lead).toMatchObject({ id: "q-1", codigo: "LL-ABCDE", grupo: "calificado", estado: "nuevo" });
    expect(db.from).toHaveBeenCalledWith("quote_requests");
    const fila = (insert.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(fila).toMatchObject({ code: "LL-ABCDE", name: "Ana", email: "a@b.co", whatsapp: "+51987654321", travelers: 2, month: 1, status: "nuevo" });
    expect(JSON.parse(fila.notes as string)).toMatchObject({ origen: "armador-v2", score: { total: 61, grupo: "calificado" }, itinerarioSlug: "slug", utm: { source: "ig" } });
    warn.mockRestore();
  });

  it("el resto no rompe: devuelve vacío", async () => {
    const r = new RepoConRespaldo(sinTablas(), dbFalso().db);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await r.obtenerLead("x")).toBeNull();
    expect(await r.buscarPorHuella("h", new Date())).toBeNull();
    expect(await r.contarIntentosIp("ip", new Date())).toBe(0);
    expect(await r.mailsVencidos(new Date(), 10)).toEqual([]);
    expect(await r.tomarMail(1, 0)).toBe(false);
    await expect(r.registrarEvento({ leadId: "x", tipo: "envio", payload: {} })).resolves.toBeUndefined();
    await expect(r.encolarMails([])).resolves.toBeUndefined();
  });

  it("con las tablas creadas usa el repositorio normal", async () => {
    const base = new RepoMemoria();
    const { db } = dbFalso();
    const lead = await new RepoConRespaldo(base, db).crearLead(LEAD);
    expect(lead.id).toBe("lead-1");
    expect(db.from).not.toHaveBeenCalled();
  });

  it("otros errores no se tapan", async () => {
    const roto = new Proxy({}, { get: () => async () => { throw Object.assign(new Error("timeout"), { code: "57014" }); } }) as RepoLeads;
    await expect(new RepoConRespaldo(roto, dbFalso().db).crearLead(LEAD)).rejects.toThrow("timeout");
  });
});

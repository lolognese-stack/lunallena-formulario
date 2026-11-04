import { describe, expect, it } from "vitest";
import { clasificarComentario } from "./comentario";
import {
  acotarTotal,
  mesesHasta,
  puntosCuando,
  puntosDuracion,
  puntosPresupuesto,
  puntosTicket,
  ratioPresupuesto,
  scoreLead,
  scoreParcial,
  seleccionarPuente,
  ticketTotalUsd,
  tieneReglaNoCalificado,
  type Contexto,
  type Respuestas,
} from "./v2";
import { normalizarWhatsapp, whatsappValido } from "./whatsapp";

// Hoy fijo: 15 de noviembre de 2026 (mes 11). Precio desde: USD 1.000 por persona.
const HOY = new Date(2026, 10, 15);
const CTX: Contexto = { hoy: HOY, precioDesdeUsd: 1000 };

/** Respuestas base: parcial 70, fuera de la zona gris, sin reglas duras. */
const BASE: Respuestas = {
  viajeros: 2,
  experiencias: ["machu-picchu"],
  mes: 1, // enero: 2 meses → 15
  flexibilidad: "aproximadas",
  dias: "6-7", // piso 6 → 3
  hotel: "estandar", // 3
  presupuesto: "1000-1500", // medio 1250, ratio 1,25 → 20; ticket 2500 → 11
  etapa: "comparando", // 13
  vuelos: "cotizando", // 5
};
const con = (cambios: Partial<Respuestas>): Respuestas => ({ ...BASE, ...cambios });

const COMENTARIO_CONCRETO = "Viajamos con mis dos hijos y queremos ir en julio sin apuro.";
const COMENTARIO_VAGO = "Queremos conocer lo mejor del lugar con calma total.";

describe("factores en sus bordes", () => {
  it.each([
    [null, 6],
    [1.5, 20],
    [1, 20],
    [0.99, 12],
    [0.75, 12],
    [0.7499, 5],
    [0.5, 5],
    [0.4999, 0],
    [0, 0],
  ])("presupuesto vs precio desde: ratio %s → %i", (ratio, puntos) => {
    expect(puntosPresupuesto(ratio)).toBe(puntos);
  });

  it.each([
    ["nose", 1000, null],
    ["500-1000", 1000, 0.75],
    ["lt500", 800, 0.5],
    ["gt2500", 1000, 3],
    ["1000-1500", null, null],
    ["1000-1500", 0, null],
    ["1000-1500", -5, null],
    ["1000-1500", Number.NaN, null],
  ] as const)("ratio: %s con precio %s → %s", (presupuesto, precio, ratio) => {
    expect(ratioPresupuesto(presupuesto, precio)).toBe(ratio);
  });

  it.each([
    [null, 3],
    [3001, 15],
    [3000, 11],
    [1500, 11],
    [1499, 7],
    [800, 7],
    [799, 0],
  ])("ticket total %s → %i", (total, puntos) => {
    expect(puntosTicket(total)).toBe(puntos);
  });

  it("ticket = punto medio × viajeros (6 = 6+)", () => {
    expect(ticketTotalUsd("gt2500", 6)).toBe(18000);
    expect(ticketTotalUsd("lt500", 2)).toBe(800);
    expect(ticketTotalUsd("nose", 4)).toBeNull();
  });

  it.each([
    [11, 0], // mes actual
    [12, 1],
    [1, 2],
    [5, 6],
    [6, 7],
    [8, 9],
    [9, 10],
    [10, 11], // octubre ya pasó: es del año siguiente
  ])("meses hasta el mes %i (hoy noviembre) → %i", (mes, meses) => {
    expect(mesesHasta(mes, HOY)).toBe(meses);
  });

  it("mes ya pasado → año siguiente, también en enero", () => {
    expect(mesesHasta(12, new Date(2027, 0, 10))).toBe(11);
    expect(mesesHasta(1, new Date(2027, 0, 10))).toBe(0);
  });

  it.each([
    [0, 8],
    [1, 15],
    [6, 15],
    [7, 12],
    [9, 12],
    [10, 5],
    [11, 5],
  ])("cuándo: %i meses → %i", (meses, puntos) => {
    expect(puntosCuando(meses)).toBe(puntos);
  });

  it.each([
    [4, 1],
    [5, 3],
    [6, 3],
    [7, 4],
    [9, 4],
    [10, 5],
    [11, 5],
  ])("duración: %i días → %i", (dias, puntos) => {
    expect(puntosDuracion(dias)).toBe(puntos);
  });

  it.each([
    ["4-5", 1],
    ["6-7", 3],
    ["8-10", 4], // piso 8: nunca llega a 5
    ["11+", 5],
  ] as const)("duración por rango %s (usa el piso) → %i", (dias, puntos) => {
    expect(scoreLead(con({ dias }), CTX).desglose.duracion).toBe(puntos);
  });

  it.each([
    ["listo", 20],
    ["comparando", 13],
    ["mirando", 4],
  ] as const)("etapa %s → %i", (etapa, puntos) => {
    expect(scoreLead(con({ etapa, vuelos: "no" }), CTX).desglose.etapa).toBe(puntos);
  });

  it.each([
    ["comprados", 10],
    ["cotizando", 5],
    ["no", 0],
  ] as const)("vuelos %s → %i", (vuelos, puntos) => {
    expect(scoreLead(con({ vuelos }), CTX).desglose.vuelos).toBe(puntos);
  });

  it.each([
    ["superior", 5],
    ["estandar", 3],
    ["economico", 1],
  ] as const)("hotel %s → %i", (hotel, puntos) => {
    expect(scoreLead(con({ hotel }), CTX).desglose.hotel).toBe(puntos);
  });

  it.each([
    [undefined, 0],
    ["", 0],
    [COMENTARIO_VAGO, 2],
    [COMENTARIO_CONCRETO, 5],
  ])("comentario %j → %i", (comentario, puntos) => {
    expect(scoreLead(con({ comentario }), CTX).desglose.comentario).toBe(puntos);
  });

  it.each([
    ["+51987654321", 5],
    ["", 0],
    [undefined, 0],
    ["987654321", 0],
  ])("whatsapp %j → %i", (whatsapp, puntos) => {
    expect(scoreLead(con({ whatsapp }), CTX).desglose.whatsapp).toBe(puntos);
  });
});

describe("comentario concreto vs vago (determinista, sin IA)", () => {
  const cuarenta = (base: string) => base.padEnd(40, ".");
  it.each([
    [undefined, "vacio"],
    ["", "vacio"],
    ["     ", "vacio"],
    ["Somos 2 en julio", "vago"], // tiene señales pero menos de 40 caracteres
    [COMENTARIO_VAGO, "vago"],
    ["Nos interesa mucho la cultura local y la comida típica", "vago"],
    [cuarenta("Somos 4"), "concreto"], // número, exactamente 40
    [cuarenta("Somos 4").slice(0, 39), "vago"], // 39 caracteres
    ["Pensamos viajar a fines de setiembre si se puede", "concreto"], // mes
    ["Queremos saber si conviene el tren o el bus, ¿qué nos recomiendan?", "concreto"], // "?"
    ["Voy con mi mamá que tiene problemas para caminar mucho", "concreto"], // tilde
    ["Voy con mi mama que tiene problemas para caminar mucho", "concreto"], // sin tilde
    ["Viajamos con dos niños chicos y queremos ir tranquilos", "concreto"],
    ["Viajamos con el BEBÉ y nos preocupa mucho la altura allá", "concreto"], // mayúsculas
    ["Es nuestra luna de miel y mi pareja ama la fotografía", "concreto"],
    ["Nos encanta el papagayo y las aves de colores del bosque", "vago"], // "papa" dentro de otra palabra no cuenta
    ["Vamos con amigos del trabajo a conocer todo lo posible", "concreto"],
  ])("%j → %s", (texto, clase) => {
    expect(clasificarComentario(texto)).toBe(clase);
  });
});

describe("whatsapp E.164", () => {
  it.each([
    ["+51987654321", true], // Perú móvil
    ["+51 987 654 321", true], // con espacios
    ["+54 9 11 2345-6789", true], // Argentina móvil
    ["+34612345678", true], // España móvil
    ["987654321", false], // sin código de país
    ["51987654321", false], // sin "+"
    ["+5198765", false], // muy corto
    ["+51000000000", false], // no es un número válido
    ["hola", false],
    ["", false],
    [null, false],
  ])("%j → %s", (valor, valido) => {
    expect(whatsappValido(valor)).toBe(valido);
  });

  it("normaliza a E.164", () => {
    expect(normalizarWhatsapp("+51 987-654-321")).toBe("+51987654321");
    expect(normalizarWhatsapp("987654321")).toBeNull();
  });
});

describe("zona gris del score parcial (40 a 59)", () => {
  // Combinaciones exactas, con hoy = noviembre y precio desde USD 1.000.
  const casos: [number, Partial<Respuestas>, boolean][] = [
    // mirando 4 + "no sé" 6 + ticket "no sé" 3 + enero 15 + cotizando 5 + 6-7 3 + estándar 3 = 39
    [39, { etapa: "mirando", presupuesto: "nose", dias: "6-7" }, false],
    // igual con 8-10 (4) = 40
    [40, { etapa: "mirando", presupuesto: "nose", dias: "8-10" }, true],
    // listo 20 + 6 + 3 + 15 + cotizando 5 + 11+ 5 + superior 5 = 59
    [59, { etapa: "listo", presupuesto: "nose", dias: "11+", hotel: "superior" }, true],
    // comparando 13 + ratio 1,25 20 + ticket 1250 7 + noviembre 8 + cotizando 5 + 8-10 4 + estándar 3 = 60
    [60, { viajeros: 1, mes: 11, dias: "8-10" }, false],
  ];
  it.each(casos)("parcial %i → zona gris %s", (total, cambios, gris) => {
    const p = scoreParcial(con(cambios), CTX);
    expect(p.total).toBe(total);
    expect(p.zonaGris).toBe(gris);
    expect(p.preguntas.length > 0).toBe(gris);
  });

  it("el parcial no cuenta comentario ni WhatsApp (máx 90)", () => {
    const max = con({ etapa: "listo", presupuesto: "gt2500", viajeros: 2, mes: 3, vuelos: "comprados", dias: "11+", hotel: "superior" });
    const p = scoreParcial({ ...max, comentario: COMENTARIO_CONCRETO, whatsapp: "+51987654321" }, CTX);
    expect(p.total).toBe(90);
  });
});

describe("selección de preguntas puente", () => {
  const ids = (r: Respuestas, ctx = CTX) => seleccionarPuente(r, ratioPresupuesto(r.presupuesto, ctx.precioDesdeUsd), ctx.precioDesdeUsd);

  it.each([
    ["A: presupuesto no sé", { presupuesto: "nose", etapa: "listo", vuelos: "cotizando" }, ["precio"]],
    ["A: ratio 0,75", { presupuesto: "500-1000", etapa: "listo", vuelos: "cotizando" }, ["precio"]],
    ["A: ratio 0,50", { presupuesto: "lt500", etapa: "listo", vuelos: "cotizando" }, ["precio"]],
    ["A + B: ratio 0,75 y comparando", { presupuesto: "500-1000", etapa: "comparando" }, ["precio", "reserva"]],
    ["B: comparando con ratio ≥ 1", { etapa: "comparando" }, ["reserva"]],
    ["B: vuelos todavía no", { etapa: "listo", vuelos: "no" }, ["reserva"]],
    ["C: ni A ni B", { etapa: "listo", vuelos: "cotizando" }, ["decide"]],
    ["C: mirando con vuelos comprados", { etapa: "mirando", vuelos: "comprados" }, ["decide"]],
    ["sin A con ratio < 0,50", { presupuesto: "lt500", etapa: "listo", vuelos: "cotizando" }, ["decide"]],
  ] as [string, Partial<Respuestas>, string[]][])("%s", (_, cambios, esperado) => {
    // "lt500" con precio 800 da ratio 0,50; con 1000 da 0,40.
    const ctx = _ === "A: ratio 0,50" ? { ...CTX, precioDesdeUsd: 800 } : CTX;
    expect(ids(con(cambios), ctx)).toEqual(esperado);
  });

  it("sin precio desde no se pregunta por precio, aunque el presupuesto sea no sé", () => {
    expect(ids(con({ presupuesto: "nose", etapa: "listo", vuelos: "cotizando" }), { ...CTX, precioDesdeUsd: null })).toEqual(["decide"]);
  });

  it("nunca más de 2 y C no se suma a A y B", () => {
    const r = con({ presupuesto: "nose", etapa: "comparando", vuelos: "no" });
    expect(ids(r)).toEqual(["precio", "reserva"]);
  });

  it("la pregunta de precio muestra el precio desde", () => {
    const p = scoreParcial(con({ etapa: "mirando", presupuesto: "nose", dias: "8-10" }), { ...CTX, precioDesdeUsd: 1234.4 });
    expect(p.preguntas[0].titulo).toBe("Viajes como el tuyo arrancan en USD 1,234 por persona. ¿Te sirve?");
  });
});

describe("puntos de las preguntas puente", () => {
  // Parcial 40, ve solo la pregunta de precio.
  const gris = con({ etapa: "mirando", presupuesto: "nose", dias: "8-10" });
  // Parcial 48 con A y B: comparando 13 + ratio 0,75 12 + ticket 1500 11 + noviembre 8 + vuelos no 0 + 6-7 3 + económico 1.
  const grisAB = con({ presupuesto: "500-1000", mes: 11, vuelos: "no", hotel: "economico" });

  it.each([
    ["dentro", 50],
    ["alto", 43],
    ["lejos", 30],
  ] as const)("precio %s suma al total", (precio, total) => {
    const s = scoreLead({ ...gris, puente: { precio } }, CTX);
    expect(s.total).toBe(total);
    expect(s.vioPuente).toBe(true);
    expect(s.respuestasPuente).toEqual({ precio });
  });

  it("A + B suman las dos", () => {
    expect(scoreParcial(grisAB, CTX).total).toBe(48);
    const s = scoreLead({ ...grisAB, puente: { precio: "dentro", reserva: "este_mes" } }, CTX);
    expect(s.preguntasMostradas).toEqual(["precio", "reserva"]);
    expect(s.desglose.puente).toBe(20);
    expect(s.total).toBe(68);
    expect(s.grupo).toBe("calificado");
  });

  it.each([
    ["este_mes", 10],
    ["1a3_meses", 5],
    ["nose", 0],
  ] as const)("reserva %s → %i", (reserva, puntos) => {
    expect(scoreLead({ ...grisAB, puente: { reserva } }, CTX).desglose.puente).toBe(puntos);
  });

  it.each([
    ["solo_yo", 5],
    ["falta_alguien", 0],
  ] as const)("decide %s → %i", (decide, puntos) => {
    // Parcial 59 sin A ni B: listo, "no sé" sin precio, cotizando.
    const r = con({ etapa: "listo", presupuesto: "nose", dias: "11+", hotel: "superior", puente: { decide } });
    expect(scoreLead(r, { ...CTX, precioDesdeUsd: null }).desglose.puente).toBe(puntos);
  });

  it("ignora respuestas a preguntas que el servidor no mostró", () => {
    const s = scoreLead({ ...gris, puente: { precio: "dentro", reserva: "este_mes", decide: "solo_yo" } }, CTX);
    expect(s.desglose.puente).toBe(10);
    expect(s.respuestasPuente).toEqual({ precio: "dentro" });
  });

  it("fuera de la zona gris no hay puente aunque el front mande respuestas", () => {
    const s = scoreLead({ ...BASE, puente: { reserva: "este_mes" } }, CTX);
    expect(s.vioPuente).toBe(false);
    expect(s.desglose.puente).toBe(0);
    expect(s.respuestasPuente).toEqual({});
  });

  it("ignora valores que no existen", () => {
    const s = scoreLead({ ...gris, puente: { precio: "regalado" as never } }, CTX);
    expect(s.desglose.puente).toBe(0);
  });
});

describe("reglas duras", () => {
  it("ratio < 0,50 → no_calificado aunque el total pase 60", () => {
    // listo, ratio 0,40, ticket 400×6 = 2400, enero, cotizando, 11+, superior, comentario y WhatsApp.
    const r = con({ etapa: "listo", presupuesto: "lt500", viajeros: 6, dias: "11+", hotel: "superior", comentario: COMENTARIO_CONCRETO, whatsapp: "+51987654321" });
    const s = scoreLead(r, CTX);
    expect(s.total).toBeGreaterThanOrEqual(60);
    expect(s.reglasAplicadas).toEqual(["presupuesto_menor_50"]);
    expect(s.grupo).toBe("no_calificado");
  });

  it("ratio exactamente 0,50 no dispara la regla", () => {
    const s = scoreLead(con({ presupuesto: "lt500" }), { ...CTX, precioDesdeUsd: 800 });
    expect(s.reglasAplicadas).toEqual([]);
  });

  it("puente de precio 'lejos' → no_calificado", () => {
    // Parcial 52 con A y B (hotel superior); lejos −10 + este mes +10 + comentario 5 + WhatsApp 5 = 62: pasa 60 y aun así no califica.
    const r = con({ presupuesto: "500-1000", mes: 11, vuelos: "no", hotel: "superior", comentario: COMENTARIO_CONCRETO, whatsapp: "+51987654321", puente: { precio: "lejos", reserva: "este_mes" } });
    const s = scoreLead(r, CTX);
    expect(s.total).toBeGreaterThanOrEqual(60);
    expect(s.reglasAplicadas).toEqual(["puente_precio_lejos"]);
    expect(s.grupo).toBe("no_calificado");
  });

  it("listo para reservar + vuelos comprados → calificado aunque el total sea bajo", () => {
    const r = con({ etapa: "listo", vuelos: "comprados", presupuesto: "nose", viajeros: 1, mes: 10, dias: "4-5", hotel: "economico" });
    const s = scoreLead(r, CTX);
    expect(s.total).toBeLessThan(60);
    expect(s.reglasAplicadas).toEqual(["listo_con_vuelos"]);
    expect(s.grupo).toBe("calificado");
  });

  it("choque: listo + comprados con ratio < 0,50 → gana no_calificado", () => {
    const s = scoreLead(con({ etapa: "listo", vuelos: "comprados", presupuesto: "lt500" }), CTX);
    expect(s.reglasAplicadas).toEqual(["presupuesto_menor_50", "listo_con_vuelos"]);
    expect(s.grupo).toBe("no_calificado");
  });

  it("choque: listo + comprados con puente 'lejos' → gana no_calificado", () => {
    // listo 20 + "no sé" 6 + ticket 3 + noviembre 8 + comprados 10 + 4-5 1 + económico 1 = 49 → ve la pregunta de precio.
    const r = con({ etapa: "listo", vuelos: "comprados", presupuesto: "nose", mes: 11, dias: "4-5", hotel: "economico", puente: { precio: "lejos" } });
    const s = scoreLead(r, CTX);
    expect(s.parcial).toBe(49);
    expect(s.reglasAplicadas).toEqual(["puente_precio_lejos", "listo_con_vuelos"]);
    expect(s.grupo).toBe("no_calificado");
  });

  it("tieneReglaNoCalificado", () => {
    expect(tieneReglaNoCalificado(["listo_con_vuelos"])).toBe(false);
    expect(tieneReglaNoCalificado(["presupuesto_menor_50"])).toBe(true);
    expect(tieneReglaNoCalificado(["puente_precio_lejos", "listo_con_vuelos"])).toBe(true);
  });
});

describe("grupo, tope y piso", () => {
  it.each([
    [59, "no_calificado"],
    [60, "calificado"],
  ] as const)("total %i → %s", (total, grupo) => {
    // Parciales exactos de la zona gris, sin puente respondido ni reglas.
    const r = total === 60 ? con({ viajeros: 1, mes: 11, dias: "8-10" }) : con({ etapa: "listo", presupuesto: "nose", dias: "11+", hotel: "superior" });
    const s = scoreLead(r, CTX);
    expect(s.total).toBe(total);
    expect(s.grupo).toBe(grupo);
  });

  it("máximo posible = 100", () => {
    const r = con({ etapa: "listo", presupuesto: "gt2500", mes: 3, vuelos: "comprados", dias: "11+", hotel: "superior", comentario: COMENTARIO_CONCRETO, whatsapp: "+51987654321" });
    const s = scoreLead(r, CTX);
    expect(s.total).toBe(100);
    expect(Object.values(s.desglose).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it.each([
    [130, 100],
    [100, 100],
    [55, 55],
    [0, 0],
    [-10, 0],
  ])("acotar %i → %i", (n, esperado) => {
    expect(acotarTotal(n)).toBe(esperado);
  });

  it("devuelve scoreVersion v2 y es determinista", () => {
    const a = scoreLead(con({ comentario: COMENTARIO_CONCRETO }), CTX);
    const b = scoreLead(con({ comentario: COMENTARIO_CONCRETO }), CTX);
    expect(a).toEqual(b);
    expect(a.scoreVersion).toBe("v2");
  });

  it("base: desglose completo", () => {
    expect(scoreLead(BASE, CTX).desglose).toEqual({
      etapa: 13, presupuesto: 20, ticket: 11, cuando: 15, vuelos: 5, duracion: 3, hotel: 3, comentario: 0, whatsapp: 0, puente: 0,
    });
  });
});

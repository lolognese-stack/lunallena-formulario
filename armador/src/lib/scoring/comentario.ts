// Clasifica el comentario opcional "¿Algo que debamos saber?". Determinista, sin IA.
//
//   concreto: 40+ caracteres Y al menos uno de: un número, un nombre de mes, un "?",
//             o una palabra de personas (hijo/a, hijos, pareja, esposo/a, novio/a,
//             padres, mamá, papá, amigos, bebé, niños).
//   vago:     tiene texto pero no cumple lo anterior.
//   vacio:    sin texto (o solo espacios).

export type ClaseComentario = "concreto" | "vago" | "vacio";

export const MIN_CONCRETO = 40;

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
  "septiembre", "setiembre", "octubre", "noviembre", "diciembre",
];

// Sin tildes: el texto se normaliza antes de buscar.
const PERSONAS = [
  "hijo", "hija", "hijos", "hijas", "pareja", "esposo", "esposa", "novio", "novia",
  "padres", "mama", "papa", "amigos", "amigas", "bebe", "bebes", "nino", "nina", "ninos", "ninas",
];

const PALABRAS = new RegExp(`\\b(${[...MESES, ...PERSONAS].join("|")})\\b`);

/** Minúsculas y sin tildes (ñ → n incluida), para comparar palabras. */
export function normalizar(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function clasificarComentario(texto: string | null | undefined): ClaseComentario {
  const limpio = (texto ?? "").trim();
  if (!limpio) return "vacio";
  if (limpio.length < MIN_CONCRETO) return "vago";
  const n = normalizar(limpio);
  const concreto = /\d/.test(n) || n.includes("?") || PALABRAS.test(n);
  return concreto ? "concreto" : "vago";
}

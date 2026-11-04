import { z } from "zod";
import type { Catalogo, DiaFijo, Estilo, Respuestas } from "@/lib/motor";
import { FORMATO_RUTA_ADJUNTO, MAX_BYTES_ADJUNTO, TIPOS_ADJUNTO, type TipoAdjunto } from "./adjunto";

export const MAX_DIAS_VIAJE = 15;

const id = z.string().min(1).max(64);
const tipos = Object.keys(TIPOS_ADJUNTO) as [TipoAdjunto, ...TipoAdjunto[]];

export const esquemaArchivo = z.object({
  nombre: z.string().trim().min(1).max(200),
  tipo: z.enum(tipos),
  bytes: z.number().int().min(1).max(MAX_BYTES_ADJUNTO),
});

export const esquemaAdjunto = esquemaArchivo.extend({ ruta: z.string().regex(FORMATO_RUTA_ADJUNTO) });

/**
 * Lo que manda /cargar. Cada entrada de `dias` es un bloque: una experiencia de varios días
 * ocupa varios días del viaje. Sin `completar` es el flujo A; con `completar`, el combinado.
 */
export const esquemaCarga = z.object({
  dias: z
    .array(
      z.object({
        destinoId: id,
        experienciaId: id.optional(),
        textoLibre: z.string().trim().max(200).optional(),
        libre: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(MAX_DIAS_VIAJE),
  mes: z.number().int().min(1).max(12),
  viajeros: z.number().int().min(1).max(20),
  hotel: z.enum(["economico", "estandar", "superior"]),
  completar: z
    .object({
      dias: z.number().int().min(3).max(MAX_DIAS_VIAJE),
      estilo: z.enum(["clasico", "aventura", "mistico", "relax"]),
      destinos: z.array(id).max(8),
    })
    .optional(),
  adjunto: esquemaAdjunto.optional(),
});

export type Carga = z.infer<typeof esquemaCarga>;

export interface CargaPreparada {
  origen: "A" | "mixto";
  /** Lo que recibe el motor. En el flujo A el estilo no se usa: todos los días son fijos. */
  respuestas: Respuestas;
  /** Lo que se guarda: en el flujo A no hay estilo elegido. */
  estilo: Estilo | null;
  fijos: DiaFijo[];
}

/**
 * Convierte la carga en días fijos para el motor. Devuelve null si algo no cuadra con el
 * catálogo (destino o experiencia desconocidos, más de 15 días, menos días que los cargados).
 * - Flujo A: los días sin plan quedan libres.
 * - Combinado: los días sin plan conservan el destino y el motor elige qué hacer.
 */
export function prepararCarga(carga: Carga, catalogo: Catalogo, destinosOfrecidos: ReadonlySet<string>): CargaPreparada | null {
  const destinos = new Set(catalogo.destinos.map((d) => d.id));
  const experiencias = new Map(catalogo.experiencias.map((e) => [e.id, e]));
  const combinado = carga.completar !== undefined;

  const fijos: DiaFijo[] = [];
  let dia = 1;
  for (const d of carga.dias) {
    if (!destinos.has(d.destinoId)) return null;
    const fijo: DiaFijo = { dia, destinoId: d.destinoId };
    let ocupa = 1;
    if (d.experienciaId) {
      const e = experiencias.get(d.experienciaId);
      if (!e) return null;
      fijo.destinoId = e.destinoId;
      fijo.experienciaId = e.id;
      ocupa = e.dias;
    } else if (d.textoLibre) {
      fijo.textoLibre = d.textoLibre;
    } else if (d.libre || !combinado) {
      fijo.libre = true;
    }
    fijos.push(fijo);
    dia += ocupa;
  }
  const cargados = dia - 1;
  if (cargados > MAX_DIAS_VIAJE) return null;

  const visitados = [...new Set(fijos.map((f) => f.destinoId))];
  const base = { mes: carga.mes, viajeros: carga.viajeros, hotel: carga.hotel };

  if (!carga.completar) {
    return { origen: "A", estilo: null, fijos, respuestas: { ...base, dias: cargados, destinos: visitados, estilo: "clasico" } };
  }
  const { dias, estilo } = carga.completar;
  if (dias < cargados) return null;
  const nuevos = [...new Set(carga.completar.destinos)].filter((id) => destinosOfrecidos.has(id));
  return { origen: "mixto", estilo, fijos, respuestas: { ...base, dias, destinos: nuevos, estilo } };
}

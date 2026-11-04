"use server";

import { adjuntoSubido, permisoDeSubida } from "@/lib/datos/almacenamiento";
import { esquemaArchivo, esquemaCarga, prepararCarga } from "@/lib/datos/carga";
import { obtenerCatalogo } from "@/lib/datos/catalogo";
import { crearItinerario } from "@/lib/datos/itinerarios";
import { destinosOfrecidos } from "@/lib/datos/mapeo";
import { referenciasDe } from "@/lib/datos/referencias";
import { buildItinerary } from "@/lib/motor";

export type ResultadoSubida = { ok: true; ruta: string; url: string } | { ok: false; error: "invalido" | "no_disponible" };

/** Primer paso del adjunto: valida tipo y tamaño y devuelve un permiso de subida para una sola ruta. */
export async function prepararAdjunto(entrada: unknown): Promise<ResultadoSubida> {
  const archivo = esquemaArchivo.safeParse(entrada);
  if (!archivo.success) return { ok: false, error: "invalido" };
  try {
    const permiso = await permisoDeSubida(archivo.data.tipo);
    return permiso ? { ok: true, ...permiso } : { ok: false, error: "no_disponible" };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "no_disponible" };
  }
}

export type ResultadoCargar = { ok: true; slug: string } | { ok: false; error: "invalido" | "adjunto" | "guardado" };

/**
 * Final de /cargar (flujo A) o de "Completar los días que faltan" (combinado): valida lo
 * cargado contra el catálogo, ejecuta el motor con esos días fijos y guarda el itinerario.
 */
export async function cargarViaje(entrada: unknown): Promise<ResultadoCargar> {
  const carga = esquemaCarga.safeParse(entrada);
  if (!carga.success) return { ok: false, error: "invalido" };

  const { catalogo, fuente } = await obtenerCatalogo();
  const ofrecidos = new Set(destinosOfrecidos(catalogo).map((d) => d.id));
  const preparada = prepararCarga(carga.data, catalogo, ofrecidos);
  if (!preparada) return { ok: false, error: "invalido" };

  try {
    const { adjunto } = carga.data;
    if (adjunto && !(await adjuntoSubido(adjunto))) return { ok: false, error: "adjunto" };

    const itinerario = buildItinerary(preparada.respuestas, catalogo, preparada.fijos);
    const slug = await crearItinerario({
      origen: preparada.origen,
      respuestas: { ...preparada.respuestas, estilo: preparada.estilo },
      fuenteCatalogo: fuente,
      itinerario,
      referencias: referenciasDe(itinerario, catalogo),
      cargados: preparada.fijos,
      ...(adjunto && { adjunto }),
    });
    return { ok: true, slug };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "guardado" };
  }
}

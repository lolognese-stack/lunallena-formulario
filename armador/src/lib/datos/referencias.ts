import type { Catalogo, Itinerario } from "@/lib/motor";

/**
 * Lo mínimo del catálogo que hace falta para mostrar un itinerario. Se guarda junto
 * con el itinerario para que el link compartido se vea igual aunque el catálogo cambie.
 */
export interface Referencias {
  destinos: Record<string, { nombre: string; imagenUrl: string | null }>;
  experiencias: Record<
    string,
    { nombre: string; imagenUrl: string | null; dificultad: number; dias: number; precioDesde: number }
  >;
}

export function referenciasDe(itinerario: Itinerario, catalogo: Catalogo): Referencias {
  const idsDestinos = new Set(itinerario.dias.flatMap((d) => [d.destinoId, d.traslado?.desdeId, d.traslado?.hastaId]).filter(Boolean));
  const idsExperiencias = new Set(itinerario.dias.flatMap((d) => [d.experienciaId, ...d.alternativas]).filter(Boolean));

  const referencias: Referencias = { destinos: {}, experiencias: {} };
  for (const d of catalogo.destinos) {
    if (idsDestinos.has(d.id)) referencias.destinos[d.id] = { nombre: d.nombre, imagenUrl: d.imagenUrl ?? null };
  }
  for (const e of catalogo.experiencias) {
    if (idsExperiencias.has(e.id)) {
      referencias.experiencias[e.id] = { nombre: e.nombre, imagenUrl: e.imagenUrl, dificultad: e.dificultad, dias: e.dias, precioDesde: e.precioDesde };
    }
  }
  return referencias;
}

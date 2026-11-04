// Vista previa del paso 8: los primeros días con detalle y el resto solo con número y destino
// (el navegador los muestra borrosos). El detalle de los días ocultos nunca sale del servidor.

import { referenciasDe } from "@/lib/datos/referencias";
import type { Catalogo, Itinerario, TipoDia } from "@/lib/motor";

export const DIAS_VISIBLES = 2;

export interface DiaVista {
  numero: number;
  destino: string;
  visible: boolean;
  tipo?: TipoDia;
  experiencia?: string | null;
  imagenUrl?: string | null;
}

export interface VistaPrevia {
  totalDias: number;
  ruta: string[];
  precioDesdeUsd: number | null;
  dias: DiaVista[];
}

export function vistaPrevia(itinerario: Itinerario, catalogo: Catalogo, precioDesdeUsd: number | null, visibles = DIAS_VISIBLES): VistaPrevia {
  const ref = referenciasDe(itinerario, catalogo);
  const nombreDestino = (id: string) => ref.destinos[id]?.nombre ?? id;
  return {
    totalDias: itinerario.dias.length,
    ruta: [...new Set(itinerario.ruta.map(nombreDestino))],
    precioDesdeUsd,
    dias: itinerario.dias.map((d) => {
      const base = { numero: d.numero, destino: nombreDestino(d.destinoId), visible: d.numero <= visibles };
      if (!base.visible) return base;
      const exp = d.experienciaId ? ref.experiencias[d.experienciaId] : null;
      return { ...base, tipo: d.tipo, experiencia: exp?.nombre ?? null, imagenUrl: exp?.imagenUrl ?? ref.destinos[d.destinoId]?.imagenUrl ?? null };
    }),
  };
}

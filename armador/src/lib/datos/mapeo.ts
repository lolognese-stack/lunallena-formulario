// Convierte las filas de Supabase a los tipos del motor (docs/plan.md, "Modelo de datos").
import type { Catalogo } from "@/lib/motor";
import type { Tables } from "@/lib/supabase/database.types";

export interface FilasCatalogo {
  destinations: Tables<"destinations">[];
  experiences: Tables<"experiences">[];
  legs: Tables<"legs">[];
  hotel_tiers: Tables<"hotel_tiers">[];
}

export function catalogoDesdeFilas(filas: FilasCatalogo): Catalogo {
  return {
    destinos: filas.destinations.map((d) => ({
      id: d.id,
      slug: d.slug,
      nombre: d.name,
      altitudM: d.altitude_m,
      nochesMinimas: d.min_nights,
      ordenRuta: d.route_order,
      esNucleo: d.is_core,
      imagenUrl: d.image_url,
    })),
    experiencias: filas.experiences.map((e) => ({
      id: e.id,
      slug: e.slug,
      nombre: e.name,
      destinoId: e.destination_id,
      duracion: e.duration,
      dias: e.days,
      dificultad: e.difficulty,
      altitudMaxM: e.max_altitude_m,
      estilos: e.styles,
      // PostgREST puede devolver `numeric` como texto: se normaliza a número.
      precioDesde: Number(e.price_from_pen),
      mesesCerrados: e.closed_months,
      terminaEnId: e.ends_at_destination_id,
      esTrek: e.is_trek,
      esIcono: e.is_icon,
      alAireLibre: e.is_outdoor,
      imagenUrl: e.image_url,
    })),
    traslados: filas.legs.map((l) => ({
      desdeId: l.from_id,
      hastaId: l.to_id,
      modo: l.mode,
      horas: Number(l.hours),
      ocupaDia: l.uses_full_day,
    })),
    hoteles: filas.hotel_tiers.map((h) => ({
      destinoId: h.destination_id,
      categoria: h.tier,
      precioNoche: Number(h.price_per_night_from_pen),
    })),
  };
}

/** Destinos que se ofrecen en /armar: el plan pide ocultar los que tienen menos de 2 experiencias. */
export function destinosOfrecidos(catalogo: Catalogo, minimo = 2) {
  const porDestino = new Map<string, number>();
  for (const e of catalogo.experiencias) porDestino.set(e.destinoId, (porDestino.get(e.destinoId) ?? 0) + 1);
  return [...catalogo.destinos]
    .filter((d) => (porDestino.get(d.id) ?? 0) >= minimo)
    .sort((a, b) => Number(b.esNucleo) - Number(a.esNucleo) || a.ordenRuta - b.ordenRuta);
}

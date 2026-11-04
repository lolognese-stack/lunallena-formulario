import "server-only";
import { cacheLife } from "next/cache";
import type { Catalogo } from "@/lib/motor";
import { catalogoPrueba } from "@/lib/motor/catalogo-prueba";
import type { FuenteCatalogo } from "./guardado";
import { catalogoDesdeFilas } from "./mapeo";
import { clientePublico } from "./supabase";

/**
 * Catálogo activo desde Supabase, cacheado unos minutos (el equipo lo edita en el panel).
 * Mientras la base no tenga experiencias cargadas, usa el catálogo de prueba y lo informa
 * en `fuente`, para que la interfaz lo avise.
 */
export async function obtenerCatalogo(): Promise<{ catalogo: Catalogo; fuente: FuenteCatalogo }> {
  "use cache";
  cacheLife("minutes");

  const supabase = clientePublico();
  if (!supabase) return { catalogo: catalogoPrueba, fuente: "prueba" };

  const [destinations, experiences, legs, hotelTiers] = await Promise.all([
    supabase.from("destinations").select("*"),
    supabase.from("experiences").select("*"),
    supabase.from("legs").select("*"),
    supabase.from("hotel_tiers").select("*"),
  ]);
  const error = destinations.error ?? experiences.error ?? legs.error ?? hotelTiers.error;
  if (error) {
    console.error("No se pudo leer el catálogo de Supabase; se usa el de prueba.", error.message);
    return { catalogo: catalogoPrueba, fuente: "prueba" };
  }
  if (!experiences.data?.length) return { catalogo: catalogoPrueba, fuente: "prueba" };

  // RLS ya filtra las filas inactivas.
  const catalogo = catalogoDesdeFilas({
    destinations: destinations.data ?? [],
    experiences: experiences.data,
    legs: legs.data ?? [],
    hotel_tiers: hotelTiers.data ?? [],
  });
  return { catalogo, fuente: "supabase" };
}

import { BASE_DE } from "./config";
import type { Catalogo, CategoriaHotel, Destino, Experiencia, Traslado } from "./tipos";

/** Acceso rápido al catálogo. Ordena todo de forma estable para que el motor sea determinista. */
export class Indice {
  readonly destinos = new Map<string, Destino>();
  readonly porSlug = new Map<string, Destino>();
  readonly experiencias = new Map<string, Experiencia>();
  private readonly experienciasPorDestino = new Map<string, Experiencia[]>();

  constructor(private readonly catalogo: Catalogo) {
    for (const d of catalogo.destinos) {
      this.destinos.set(d.id, d);
      this.porSlug.set(d.slug, d);
    }
    const ordenadas = [...catalogo.experiencias].sort((a, b) => a.slug.localeCompare(b.slug));
    for (const e of ordenadas) {
      this.experiencias.set(e.id, e);
      const lista = this.experienciasPorDestino.get(e.destinoId) ?? [];
      lista.push(e);
      this.experienciasPorDestino.set(e.destinoId, lista);
    }
  }

  destino(id: string): Destino {
    const d = this.destinos.get(id);
    if (!d) throw new Error(`Destino desconocido: ${id}`);
    return d;
  }

  slug(id: string | null): string | null {
    return id ? (this.destinos.get(id)?.slug ?? null) : null;
  }

  experienciasDe(destinoId: string): Experiencia[] {
    return this.experienciasPorDestino.get(destinoId) ?? [];
  }

  /** Destino base (p. ej. Cusco para Machu Picchu), si lo tiene. */
  base(destinoId: string): Destino | null {
    const slugBase = BASE_DE[this.destino(destinoId).slug];
    return slugBase ? (this.porSlug.get(slugBase) ?? null) : null;
  }

  /**
   * Traslado entre dos destinos. Si no hay uno directo, prueba desde o hacia la base
   * (p. ej. Machu Picchu → Puno se resuelve como Cusco → Puno: se vuelve a dormir a Cusco).
   */
  traslado(desdeId: string, hastaId: string): Traslado | null {
    const buscar = (a: string, b: string) => this.catalogo.traslados.find((t) => t.desdeId === a && t.hastaId === b) ?? null;
    const baseDesde = this.base(desdeId)?.id;
    const baseHasta = this.base(hastaId)?.id;
    return (
      buscar(desdeId, hastaId) ??
      (baseDesde ? buscar(baseDesde, hastaId) : null) ??
      (baseHasta ? buscar(desdeId, baseHasta) : null) ??
      (baseDesde && baseHasta && baseDesde !== baseHasta ? buscar(baseDesde, baseHasta) : null)
    );
  }

  precioHotel(destinoId: string, categoria: CategoriaHotel): number | null {
    return this.catalogo.hoteles.find((h) => h.destinoId === destinoId && h.categoria === categoria)?.precioNoche ?? null;
  }
}

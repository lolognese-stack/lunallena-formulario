// Reglas duras (filtros) y puntaje (preferencias blandas) de docs/plan.md, "Motor de armado".
import {
  DIAS_DE_ALTURA_ANTES_DE_TREK,
  DIFICULTAD_EXIGENTE,
  DIFICULTAD_MAX_ACLIMATACION,
  DIFICULTAD_POR_ESTILO,
  LLEGADA_PERMITIDA_DESDE,
  MESES_DE_LLUVIA,
  PESOS,
  UNA_EXPERIENCIA_POR_DESTINO,
} from "./config";
import type { Indice } from "./indice";
import type { Estilo, Experiencia } from "./tipos";

/** Situación del viaje en el día que se está llenando. */
export interface Contexto {
  mes: number;
  estilo: Estilo;
  /** Primer día en un destino de altura (o segundo, si se llegó desde la costa). */
  aclimatando: boolean;
  /** Días ya pasados en destinos de más de 3.000 m. */
  diasEnAltura: number;
  dificultadPrevia: number;
  /** Dónde terminó el día anterior (id de destino). */
  ubicacionPrevia: string | null;
  /** Días seguidos libres en este destino a partir de hoy. */
  diasDisponibles: number;
  usadas: ReadonlySet<string>;
  /** Destinos de visita única que ya tienen su experiencia. */
  visitados: ReadonlySet<string>;
}

/** Filtros que no dependen del día: mes cerrado y treks solo con aventura. */
export function pasaFiltroFijo(e: Experiencia, mes: number, estilo: Estilo): boolean {
  if (e.mesesCerrados.includes(mes)) return false;
  if (e.esTrek && estilo !== "aventura") return false;
  return true;
}

export function esCompatible(e: Experiencia, ctx: Contexto, indice: Indice): boolean {
  if (ctx.usadas.has(e.id)) return false;
  if (!pasaFiltroFijo(e, ctx.mes, ctx.estilo)) return false;
  if (e.dias > ctx.diasDisponibles) return false;
  if (ctx.aclimatando && e.dificultad > DIFICULTAD_MAX_ACLIMATACION) return false;
  if (e.esTrek && ctx.diasEnAltura < DIAS_DE_ALTURA_ANTES_DE_TREK) return false;
  if (e.dificultad >= DIFICULTAD_EXIGENTE && ctx.dificultadPrevia >= DIFICULTAD_EXIGENTE) return false;

  const slugDestino = indice.slug(e.destinoId)!;
  if (UNA_EXPERIENCIA_POR_DESTINO.includes(slugDestino) && ctx.visitados.has(e.destinoId)) return false;
  const permitidos = LLEGADA_PERMITIDA_DESDE[slugDestino];
  if (permitidos && !permitidos.includes(indice.slug(ctx.ubicacionPrevia) ?? "")) return false;
  return true;
}

export function puntaje(e: Experiencia, mes: number, estilo: Estilo): number {
  let p = 0;
  if (e.estilos.includes(estilo)) p += PESOS.coincideEstilo;
  const [min, max] = DIFICULTAD_POR_ESTILO[estilo];
  if (e.dificultad >= min && e.dificultad <= max) p += PESOS.dificultadAcordeAlEstilo;
  if (e.esIcono) p += PESOS.iconoDelDestino;
  if (e.alAireLibre && MESES_DE_LLUVIA.includes(mes)) p += PESOS.lluviaAlAireLibre;
  return p;
}

/**
 * Orden de preferencia: más puntaje; a igual puntaje, la que es del estilo y llena
 * justo los días libres del bloque (p. ej. el Camino Inka en los 4 días reservados
 * para él), después la más barata y por último el slug.
 */
export function ordenarCandidatas(candidatas: Experiencia[], mes: number, estilo: Estilo, diasDelBloque?: number): Experiencia[] {
  const llena = (e: Experiencia) => Number(e.dias > 1 && e.dias === diasDelBloque && e.estilos.includes(estilo));
  return candidatas
    .map((e) => ({ e, p: puntaje(e, mes, estilo) }))
    .sort((a, b) => b.p - a.p || llena(b.e) - llena(a.e) || a.e.precioDesde - b.e.precioDesde || a.e.slug.localeCompare(b.e.slug))
    .map(({ e }) => e);
}

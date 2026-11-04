// Números del motor que se ajustan con la agencia. Las reglas viven en reglas.ts;
// aquí solo los pesos y umbrales que las alimentan.
import type { Estilo } from "./tipos";

/** Puntaje (preferencias blandas) de docs/plan.md, "Motor de armado". */
export const PESOS = {
  coincideEstilo: 3,
  dificultadAcordeAlEstilo: 2,
  iconoDelDestino: 2,
  lluviaAlAireLibre: -1,
};

/** Dificultad (1–5) que se considera "acorde" a cada estilo. */
export const DIFICULTAD_POR_ESTILO: Record<Estilo, [min: number, max: number]> = {
  clasico: [1, 3],
  aventura: [3, 5],
  mistico: [1, 3],
  relax: [1, 2],
};

/** Temporada de lluvias en los Andes: noviembre a marzo. */
export const MESES_DE_LLUVIA = [11, 12, 1, 2, 3];

/** Más de esta altitud (m), el primer día en el destino es suave. */
export const UMBRAL_ALTURA_M = 3000;
/** Menos de esta altitud (m), el destino cuenta como costa. */
export const UMBRAL_COSTA_M = 1000;
/** Dificultad máxima en días de aclimatación. */
export const DIFICULTAD_MAX_ACLIMATACION = 2;
/** Dificultad desde la que no se encadenan dos días seguidos. */
export const DIFICULTAD_EXIGENTE = 4;
/** Días de altura que deben pasar antes de un trek. */
export const DIAS_DE_ALTURA_ANTES_DE_TREK = 2;
/** Se asume que el viajero llega al primer destino desde el nivel del mar (vuelo vía Lima). */
export const VIAJE_EMPIEZA_DESDE_COSTA = true;

/** Destinos que necesitan una base: si se eligen, se agrega la base. */
export const BASE_DE: Record<string, string> = {
  "machu-picchu": "cusco",
  "valle-sagrado": "cusco",
};

/** Antes de una experiencia en estos destinos, la anterior tiene que terminar en alguno de la lista. */
export const LLEGADA_PERMITIDA_DESDE: Record<string, string[]> = {
  "machu-picchu": ["cusco", "valle-sagrado", "machu-picchu"],
};

/** Destinos donde dos experiencias serían la misma visita (p. ej. dos trenes a Machu Picchu). */
export const UNA_EXPERIENCIA_POR_DESTINO = ["machu-picchu"];

/** Destinos a los que nunca se llega directo desde la costa (se pasa antes por la altura intermedia). */
export const SIN_LLEGADA_DESDE_COSTA = ["puno"];

/** Al repartir días sobrantes, peso de los destinos núcleo frente al resto. */
export const PESO_REPARTO = { nucleo: 2, otro: 1 };

/** Orden para quitar destinos núcleo cuando no alcanzan los días (Cusco nunca se quita). */
export const DESCARTE_NUCLEO = ["valle-sagrado", "machu-picchu"];

/** El precio "desde" se redondea hacia arriba a este múltiplo (soles). */
export const REDONDEO_PRECIO = 50;

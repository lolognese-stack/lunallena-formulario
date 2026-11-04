// Pasos 1 a 4 del motor: normalizar destinos, ordenar la ruta, repartir los días
// y respetar los días fijos. El resultado es la "maqueta": qué destino toca cada día.
import { DESCARTE_NUCLEO, PESO_REPARTO, SIN_LLEGADA_DESDE_COSTA, UMBRAL_COSTA_M, UNA_EXPERIENCIA_POR_DESTINO } from "./config";
import type { Indice } from "./indice";
import { ordenarCandidatas, pasaFiltroFijo, puntaje } from "./reglas";
import type { CodigoAviso, DiaFijo, Destino, Mensaje, Respuestas, Traslado } from "./tipos";

type Avisos = Mensaje<CodigoAviso>[];

export interface TramoTraslado {
  desdeId: string;
  hastaId: string;
  datos: Traslado | null; // null = no hay traslado cargado en el catálogo
}

/** Día fijo ya validado. `parte` > 0 marca los días siguientes de una experiencia de varios días. */
export interface FijoValidado extends DiaFijo {
  parte: number;
}

/** Un día de la maqueta, antes de elegir la experiencia. */
export interface Casilla {
  destinoId: string;
  /** Día completo de viaje. */
  traslado: TramoTraslado | null;
  /** Traslado corto que se hace el mismo día de llegada. */
  llegada: TramoTraslado | null;
  /** Solo los días fijos con contenido; los que traen solo el destino los completa el motor. */
  fijo: FijoValidado | null;
}

const tieneContenido = (f: DiaFijo) => Boolean(f.experienciaId || f.textoLibre || f.libre);

const minimoDias = (d: Destino) => Math.max(1, d.nochesMinimas);

/** Paso 1: quita repetidos y agrega la base (Cusco) si eligen Machu Picchu o Valle Sagrado. */
export function normalizarDestinos(ids: string[], indice: Indice, visitados: ReadonlySet<string>, avisos: Avisos): Destino[] {
  const elegidos: Destino[] = [];
  for (const id of ids) {
    const d = indice.destinos.get(id);
    if (d && !elegidos.includes(d) && !visitados.has(d.id)) elegidos.push(d);
  }
  for (const d of [...elegidos]) {
    const base = indice.base(d.id);
    if (base && !elegidos.includes(base) && !visitados.has(base.id)) {
      elegidos.push(base);
      avisos.push({ codigo: "base_agregada", params: { destino: base.nombre } });
    }
  }
  return elegidos;
}

/** Paso 2: orden por `ordenRuta`; a Puno nunca se llega directo desde la costa. */
export function ordenarRuta(destinos: Destino[], origen: Destino | null): Destino[] {
  const ruta = [...destinos].sort((a, b) => a.ordenRuta - b.ordenRuta || a.slug.localeCompare(b.slug));
  for (const slug of SIN_LLEGADA_DESDE_COSTA) {
    const i = ruta.findIndex((d) => d.slug === slug);
    const previo = i > 0 ? ruta[i - 1] : i === 0 ? origen : null;
    if (previo && previo.altitudM < UMBRAL_COSTA_M && i < ruta.length - 1) {
      ruta.push(...ruta.splice(i, 1));
    }
  }
  return ruta;
}

function diasDeViaje(ruta: Destino[], origen: Destino | null, indice: Indice): number {
  let dias = 0;
  ruta.forEach((d, i) => {
    const previo = i === 0 ? origen : ruta[i - 1];
    if (previo) dias += (indice.traslado(previo.id, d.id)?.ocupaDia ?? true) ? 1 : 0;
  });
  return dias;
}

const diasNecesarios = (ruta: Destino[], origen: Destino | null, indice: Indice) =>
  ruta.reduce((n, d) => n + minimoDias(d), 0) + diasDeViaje(ruta, origen, indice);

/** Paso 3: quita destinos si no alcanzan los días y reparte el resto priorizando el núcleo. */
function planificar(destinos: Destino[], disponibles: number, origen: Destino | null, r: Respuestas, indice: Indice, avisos: Avisos) {
  let actuales = [...destinos];
  let ruta = ordenarRuta(actuales, origen);

  while (ruta.length > 0 && diasNecesarios(ruta, origen, indice) > disponibles) {
    const unico = ruta.length === 1;
    // Sin núcleo, se quita primero el más alejado del inicio de la ruta.
    const victima = unico
      ? ruta[0]
      : ([...actuales].filter((d) => !d.esNucleo).sort((a, b) => b.ordenRuta - a.ordenRuta)[0] ??
        DESCARTE_NUCLEO.map((slug) => actuales.find((d) => d.slug === slug)).find((d) => d !== undefined));
    if (!victima) break;
    // Un único destino se queda aunque no cubra sus noches mínimas, salvo que no haya ni un día para llegar.
    if (unico && disponibles - diasDeViaje(ruta, origen, indice) >= 1) break;
    actuales = actuales.filter((d) => d !== victima);
    avisos.push({ codigo: "destino_quitado", params: { destino: victima.nombre, dias: r.dias } });
    ruta = ordenarRuta(actuales, origen);
  }

  const dias = new Map<string, number>();
  if (!ruta.length) return { ruta, dias };

  const enBloques = disponibles - diasDeViaje(ruta, origen, indice);
  let restante = enBloques;
  for (const d of ruta) {
    const n = Math.min(minimoDias(d), restante);
    dias.set(d.id, n);
    restante -= n;
  }

  const compatibles = (d: Destino) =>
    ordenarCandidatas(indice.experienciasDe(d.id).filter((e) => pasaFiltroFijo(e, r.mes, r.estilo)), r.mes, r.estilo);

  // Si la mejor opción de un destino dura varios días (p. ej. el Camino Inka para aventura), se le reservan.
  const porPrioridad = [...ruta].sort((a, b) => Number(b.esNucleo) - Number(a.esNucleo) || a.ordenRuta - b.ordenRuta);
  for (const d of porPrioridad) {
    const opciones = compatibles(d);
    if (!opciones.length) continue;
    const mejor = puntaje(opciones[0], r.mes, r.estilo);
    const actual = dias.get(d.id)!;
    const larga = opciones.find(
      (e) => e.dias > actual && e.dias - actual <= restante && puntaje(e, r.mes, r.estilo) >= mejor,
    );
    if (larga) {
      restante -= larga.dias - actual;
      dias.set(d.id, larga.dias);
    }
  }

  // Tope por destino: no darle más días que experiencias tiene.
  const tope = (d: Destino) => {
    const opciones = compatibles(d);
    const actual = dias.get(d.id)!;
    if (UNA_EXPERIENCIA_POR_DESTINO.includes(d.slug)) return Math.max(actual, opciones[0]?.dias ?? 0);
    return Math.max(actual, opciones.reduce((n, e) => n + e.dias, 0));
  };
  const peso = (d: Destino) => (d.esNucleo ? PESO_REPARTO.nucleo : PESO_REPARTO.otro);

  while (restante > 0) {
    const conLugar = porPrioridad.filter((d) => dias.get(d.id)! < tope(d));
    // Si todos llegaron al tope, el día sobrante va a la base o al primer destino (será un día libre).
    const destino = conLugar.length
      ? conLugar.reduce((mejor, d) => (peso(d) / dias.get(d.id)! > peso(mejor) / dias.get(mejor.id)! ? d : mejor))
      : (ruta.find((d) => d.slug === "cusco") ?? ruta[0]);
    dias.set(destino.id, dias.get(destino.id)! + 1);
    restante--;
  }

  return { ruta, dias };
}

function tramo(desde: Destino, hasta: Destino, indice: Indice, avisos: Avisos): TramoTraslado {
  const datos = indice.traslado(desde.id, hasta.id);
  if (!datos) avisos.push({ codigo: "sin_traslado", params: { desde: desde.nombre, hasta: hasta.nombre } });
  return { desdeId: datos?.desdeId ?? desde.id, hastaId: datos?.hastaId ?? hasta.id, datos };
}

/** Paso 4 y armado de la maqueta: primero los días fijos, después la ruta del motor. */
export function maquetar(r: Respuestas, fijos: FijoValidado[], indice: Indice, avisos: Avisos): Casilla[] {
  const casillas: Casilla[] = [];
  const porDia = new Map(fijos.map((f) => [f.dia, f]));
  const ultimoFijo = fijos.length ? Math.max(...fijos.map((f) => f.dia)) : 0;

  // Hasta el último día fijo, los huecos quedan en el destino del día fijo anterior (o del siguiente).
  for (let dia = 1; dia <= ultimoFijo; dia++) {
    const fijo = porDia.get(dia) ?? null;
    const anterior = casillas.at(-1)?.destinoId;
    const siguiente = fijos.find((f) => f.dia > dia)?.destinoId;
    casillas.push({
      destinoId: fijo?.destinoId ?? anterior ?? siguiente!,
      traslado: null,
      llegada: null,
      fijo: fijo && tieneContenido(fijo) ? fijo : null,
    });
  }

  const disponibles = r.dias - ultimoFijo;
  if (disponibles <= 0) return casillas;

  const origen = ultimoFijo ? indice.destino(casillas[ultimoFijo - 1].destinoId) : null;
  const visitados = new Set(casillas.map((c) => c.destinoId));
  const pedidos = normalizarDestinos(r.destinos, indice, visitados, avisos);
  const { ruta, dias } = planificar(pedidos, disponibles, origen, r, indice, avisos);

  if (!ruta.length) {
    // Combinado sin destinos nuevos: se sigue en el último destino fijo.
    const destinoId = origen?.id ?? indice.destinos.keys().next().value!;
    for (let i = 0; i < disponibles; i++) casillas.push({ destinoId, traslado: null, llegada: null, fijo: null });
    return casillas;
  }

  let previo = origen;
  for (const d of ruta) {
    let llegada: TramoTraslado | null = null;
    if (previo) {
      const t = tramo(previo, d, indice, avisos);
      if (t.datos && !t.datos.ocupaDia) llegada = t;
      else casillas.push({ destinoId: t.hastaId, traslado: t, llegada: null, fijo: null });
    }
    for (let i = 0; i < dias.get(d.id)!; i++) {
      casillas.push({ destinoId: d.id, traslado: null, llegada: i === 0 ? llegada : null, fijo: null });
    }
    previo = d;
  }
  return casillas;
}

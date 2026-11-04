// Motor de armado (docs/plan.md, "Motor de armado"). Función pura: mismas
// respuestas y mismo catálogo dan siempre el mismo itinerario.
import {
  DIFICULTAD_EXIGENTE,
  LLEGADA_PERMITIDA_DESDE,
  MESES_DE_LLUVIA,
  REDONDEO_PRECIO,
  UMBRAL_ALTURA_M,
  UMBRAL_COSTA_M,
  UNA_EXPERIENCIA_POR_DESTINO,
  VIAJE_EMPIEZA_DESDE_COSTA,
} from "./config";
import { Indice } from "./indice";
import { esCompatible, ordenarCandidatas, type Contexto } from "./reglas";
import { maquetar, type Casilla, type FijoValidado, type TramoTraslado } from "./ruta";
import type {
  Catalogo,
  CodigoAviso,
  CodigoPorQue,
  DiaFijo,
  DiaItinerario,
  Experiencia,
  Itinerario,
  Mensaje,
  Respuestas,
} from "./tipos";

export type * from "./tipos";

const mensaje = <C extends string>(codigo: C, params: Record<string, string | number> = {}): Mensaje<C> => ({ codigo, params });

function datosTraslado(t: TramoTraslado | null): DiaItinerario["traslado"] {
  return t ? { desdeId: t.desdeId, hastaId: t.hastaId, modo: t.datos?.modo ?? null, horas: t.datos?.horas ?? null } : null;
}

/**
 * Descarta días fijos fuera de rango o con destino desconocido; si hay dos para el mismo día, gana el último.
 * Una experiencia de varios días ocupa los días siguientes: lo que se haya cargado en ellos se descarta.
 */
function validarFijos(fijos: DiaFijo[], r: Respuestas, indice: Indice, avisos: Mensaje<CodigoAviso>[]): FijoValidado[] {
  const porDia = new Map<number, DiaFijo>();
  for (const f of fijos) {
    if (Number.isInteger(f.dia) && f.dia >= 1 && f.dia <= r.dias && indice.destinos.has(f.destinoId)) porDia.set(f.dia, f);
    else avisos.push(mensaje("dia_fijo_invalido", { dia: f.dia }));
  }

  const validados: FijoValidado[] = [];
  let ocupadoHasta = 0;
  for (const f of [...porDia.values()].sort((a, b) => a.dia - b.dia)) {
    if (f.dia <= ocupadoHasta) {
      avisos.push(mensaje("dia_fijo_invalido", { dia: f.dia }));
      continue;
    }
    validados.push({ ...f, parte: 0 });
    const e = f.experienciaId ? indice.experiencias.get(f.experienciaId) : undefined;
    if (!e) continue;
    // El motor no filtra lo que eligió el cliente, pero avisa si está cerrado ese mes.
    if (e.mesesCerrados.includes(r.mes)) avisos.push(mensaje("fijo_cerrado", { experiencia: e.nombre, mes: r.mes }));
    for (let parte = 1; parte < e.dias && f.dia + parte <= r.dias; parte++) {
      validados.push({ dia: f.dia + parte, destinoId: f.destinoId, experienciaId: e.id, parte });
    }
    ocupadoHasta = f.dia + e.dias - 1;
  }
  return validados;
}

function porQueDe(e: Experiencia, ctx: Contexto, primerDia: boolean, r: Respuestas, destino: string): Mensaje<CodigoPorQue> {
  if (ctx.aclimatando) return mensaje(primerDia ? "aclimatacion_llegada" : "aclimatacion", { destino });
  if (e.esTrek) return mensaje("trek_aclimatado");
  if (e.esIcono) return mensaje("icono", { destino });
  if (e.estilos.includes(r.estilo)) return mensaje("estilo", { estilo: r.estilo });
  return mensaje("recomendado");
}

export function buildItinerary(respuestas: Respuestas, catalogo: Catalogo, diasFijos: DiaFijo[] = []): Itinerario {
  const r = respuestas;
  const indice = new Indice(catalogo);
  const avisos: Mensaje<CodigoAviso>[] = [];
  const fijos = validarFijos(diasFijos, r, indice, avisos);
  const casillas: Casilla[] = maquetar(r, fijos, indice, avisos);

  const dias: DiaItinerario[] = [];
  const candidatasPorDia: Experiencia[][] = [];
  const usadas = new Set<string>();
  const visitados = new Set<string>();

  // Las experiencias de los días fijos ya están usadas desde el principio.
  for (const f of fijos) {
    const e = f.experienciaId ? indice.experiencias.get(f.experienciaId) : undefined;
    if (e) {
      usadas.add(e.id);
      if (UNA_EXPERIENCIA_POR_DESTINO.includes(indice.slug(e.destinoId)!)) visitados.add(e.destinoId);
    }
  }

  let bloque: string | null = null;
  let indiceEnBloque = 0;
  let desdeCosta = VIAJE_EMPIEZA_DESDE_COSTA;
  let diasEnAltura = 0;
  let dificultadPrevia = 0;
  let ubicacionPrevia: string | null = null;
  let avisoParcial = false;

  const cerrarDia = (dia: DiaItinerario, dificultad: number, ubicacion: string, candidatas: Experiencia[] = []) => {
    dias.push(dia);
    candidatasPorDia.push(candidatas);
    dificultadPrevia = dificultad;
    ubicacionPrevia = ubicacion;
    if (indice.destino(dia.destinoId).altitudM > UMBRAL_ALTURA_M) diasEnAltura++;
  };

  for (let i = 0; i < casillas.length; ) {
    const c = casillas[i];
    const destino = indice.destino(c.destinoId);
    const numero = i + 1;
    const base = { numero, destinoId: c.destinoId, experienciaId: null, textoLibre: null, traslado: datosTraslado(c.llegada), fijo: false, alternativas: [] };

    if (c.traslado) {
      const t = c.traslado;
      cerrarDia(
        {
          ...base,
          tipo: "traslado",
          traslado: datosTraslado(t),
          porQue: mensaje("traslado", {
            desde: indice.destino(t.desdeId).nombre,
            hasta: indice.destino(t.hastaId).nombre,
            modo: t.datos?.modo ?? "otro",
            horas: t.datos?.horas ?? 0,
          }),
        },
        0,
        c.destinoId,
      );
      i++;
      continue;
    }

    if (c.destinoId !== bloque) {
      desdeCosta = bloque === null ? VIAJE_EMPIEZA_DESDE_COSTA : indice.destino(bloque).altitudM < UMBRAL_COSTA_M;
      bloque = c.destinoId;
      indiceEnBloque = 0;
    } else {
      indiceEnBloque++;
    }

    if (c.fijo) {
      const f = c.fijo;
      const e = f.experienciaId ? indice.experiencias.get(f.experienciaId) : undefined;
      if (e && f.parte > 0) {
        cerrarDia(
          {
            ...base,
            tipo: "continuacion",
            experienciaId: e.id,
            fijo: true,
            porQue: mensaje("continuacion", { experiencia: e.nombre, dia: f.parte + 1, total: e.dias }),
          },
          e.dificultad,
          f.parte === e.dias - 1 ? (e.terminaEnId ?? c.destinoId) : c.destinoId,
        );
        i++;
        continue;
      }
      if (f.experienciaId && !e) avisos.push(mensaje("dia_fijo_invalido", { dia: f.dia }));
      if (f.textoLibre && !e && !avisoParcial) {
        avisos.push(mensaje("precio_parcial"));
        avisoParcial = true;
      }
      const tipo = e ? "experiencia" : f.textoLibre && !f.experienciaId ? "texto_libre" : "libre";
      cerrarDia(
        {
          ...base,
          tipo,
          experienciaId: e?.id ?? null,
          textoLibre: tipo === "texto_libre" ? f.textoLibre! : null,
          fijo: true,
          porQue: mensaje("fijo"),
        },
        e?.dificultad ?? 0,
        e && e.dias === 1 ? (e.terminaEnId ?? c.destinoId) : c.destinoId,
      );
      i++;
      continue;
    }

    // Días libres seguidos en este destino a partir de hoy.
    let disponibles = 0;
    while (casillas[i + disponibles]?.destinoId === c.destinoId && !casillas[i + disponibles].traslado && !casillas[i + disponibles].fijo) {
      disponibles++;
    }

    const ctx: Contexto = {
      mes: r.mes,
      estilo: r.estilo,
      aclimatando: destino.altitudM > UMBRAL_ALTURA_M && (indiceEnBloque === 0 || (indiceEnBloque === 1 && desdeCosta)),
      diasEnAltura,
      dificultadPrevia,
      ubicacionPrevia,
      diasDisponibles: disponibles,
      usadas,
      visitados,
    };
    const candidatas = ordenarCandidatas(
      indice.experienciasDe(c.destinoId).filter((e) => esCompatible(e, ctx, indice)),
      r.mes,
      r.estilo,
      disponibles,
    );
    const elegida = candidatas[0];

    if (!elegida) {
      const codigo = ctx.aclimatando ? "libre_aclimatacion" : "libre";
      cerrarDia({ ...base, tipo: "libre", porQue: mensaje(codigo, { destino: destino.nombre }) }, 0, c.destinoId);
      i++;
      continue;
    }

    usadas.add(elegida.id);
    if (UNA_EXPERIENCIA_POR_DESTINO.includes(destino.slug)) visitados.add(destino.id);
    const ubicacionFinal = elegida.terminaEnId ?? c.destinoId;

    for (let j = 0; j < elegida.dias; j++) {
      if (j > 0) indiceEnBloque++;
      const ultimo = j === elegida.dias - 1;
      cerrarDia(
        {
          ...base,
          numero: numero + j,
          traslado: j === 0 ? base.traslado : null,
          tipo: j === 0 ? "experiencia" : "continuacion",
          experienciaId: elegida.id,
          porQue:
            j === 0
              ? porQueDe(elegida, ctx, indiceEnBloque === 0, r, destino.nombre)
              : mensaje("continuacion", { experiencia: elegida.nombre, dia: j + 1, total: elegida.dias }),
        },
        elegida.dificultad,
        ultimo ? ubicacionFinal : c.destinoId,
        j === 0 ? candidatas : [],
      );
    }
    i += elegida.dias;
  }

  // Paso 6: alternativas para "Cambiar". Se calculan al final para no ofrecer una
  // experiencia que el motor ya usó en otro día, ni una que rompa las reglas con el día siguiente.
  dias.forEach((dia, i) => {
    if (dia.tipo !== "experiencia" || dia.fijo) return;
    const elegida = indice.experiencias.get(dia.experienciaId!)!;
    const siguiente = dias[i + elegida.dias];
    const expSiguiente = siguiente?.tipo === "experiencia" ? indice.experiencias.get(siguiente.experienciaId!) : undefined;
    const llegadaSiguiente = expSiguiente ? LLEGADA_PERMITIDA_DESDE[indice.slug(expSiguiente.destinoId)!] : undefined;
    dia.alternativas = candidatasPorDia[i]
      .filter(
        (e) =>
          e.id !== elegida.id &&
          !usadas.has(e.id) &&
          e.dias === elegida.dias &&
          !(expSiguiente && e.dificultad >= DIFICULTAD_EXIGENTE && expSiguiente.dificultad >= DIFICULTAD_EXIGENTE) &&
          !(llegadaSiguiente && !llegadaSiguiente.includes(indice.slug(e.terminaEnId ?? e.destinoId)!)),
      )
      .slice(0, 3)
      .map((e) => e.id);
  });

  // Ruta: destinos en el orden en que se visitan.
  const ruta: string[] = [];
  for (const d of dias) if (d.tipo !== "traslado" && ruta.at(-1) !== d.destinoId) ruta.push(d.destinoId);

  const enAltura = ruta.find((id) => indice.destino(id).altitudM > UMBRAL_ALTURA_M);
  if (enAltura) avisos.push(mensaje("aclimatacion", { destino: indice.destino(enAltura).nombre }));

  const elegidas = dias.filter((d) => d.tipo === "experiencia").map((d) => indice.experiencias.get(d.experienciaId!)!);
  if (MESES_DE_LLUVIA.includes(r.mes) && elegidas.some((e) => e.alAireLibre)) avisos.push(mensaje("lluvias", { mes: r.mes }));

  // Paso 7: precio "desde" por persona.
  const precioExperiencias = elegidas.reduce((n, e) => n + e.precioDesde, 0);
  let precioHoteles = 0;
  const sinTarifa = new Set<string>();
  for (let i = 0; i < dias.length - 1; i++) {
    const d = dias[i];
    let dondeDuerme = d.destinoId;
    if (d.experienciaId && (d.tipo === "experiencia" || d.tipo === "continuacion")) {
      // Dentro de una experiencia de varios días el alojamiento ya está incluido.
      const sigue = dias[i + 1].tipo === "continuacion" && dias[i + 1].experienciaId === d.experienciaId;
      if (sigue) continue;
      dondeDuerme = indice.experiencias.get(d.experienciaId)!.terminaEnId ?? d.destinoId;
    }
    const tarifa = indice.precioHotel(dondeDuerme, r.hotel);
    if (tarifa === null) sinTarifa.add(dondeDuerme);
    else precioHoteles += tarifa;
  }
  for (const id of sinTarifa) avisos.push(mensaje("precio_hotel_pendiente", { destino: indice.destino(id).nombre }));

  const porPersona = Math.ceil((precioExperiencias + precioHoteles) / REDONDEO_PRECIO) * REDONDEO_PRECIO;

  return {
    dias,
    ruta,
    avisos,
    precio: {
      porPersona,
      total: porPersona * r.viajeros,
      experiencias: precioExperiencias,
      hoteles: precioHoteles,
    },
  };
}

"use server";

import { getTranslations } from "next-intl/server";
import { after } from "next/server";
import { correoActivo, enviar } from "@/lib/correo/resend";
import { armarCorreos } from "@/lib/correo/plantillas";
import { urlPublica } from "@/lib/contacto";
import { avisarCrm } from "@/lib/crm";
import { obtenerCatalogo } from "@/lib/datos/catalogo";
import { crearItinerario, guardarCorreos } from "@/lib/datos/itinerarios";
import { destinosOfrecidos } from "@/lib/datos/mapeo";
import { referenciasDe } from "@/lib/datos/referencias";
import { esquemaArmador } from "@/lib/datos/respuestas";
import { listaNatural, soles } from "@/lib/formato";
import { buildItinerary } from "@/lib/motor";
import { calcularScore } from "@/lib/score";

export type ResultadoArmar =
  | { ok: true; slug: string; prueba: boolean; nivel: string }
  | { ok: false; error: "invalido" | "guardado" };

/**
 * Paso final de /armar: valida respuestas y contacto, ejecuta el motor, calcula el score,
 * guarda el itinerario, crea el lead en el CRM y programa los mails. Es alcanzable por POST
 * directo, así que no confía en nada del navegador (el score se calcula acá).
 */
export async function armarViaje(entrada: unknown): Promise<ResultadoArmar> {
  const validadas = esquemaArmador.safeParse(entrada);
  if (!validadas.success) return { ok: false, error: "invalido" };
  const { perfil: p, ...base } = validadas.data;
  // Honeypot: un bot que completa el campo oculto recibe "ok" y no se guarda nada.
  if (p.apellido_2) return { ok: true, slug: "xxxxxxxxxx", prueba: true, nivel: "frio" };

  const { catalogo, fuente } = await obtenerCatalogo();
  const ofrecidos = new Set(destinosOfrecidos(catalogo).map((d) => d.id));
  const destinos = [...new Set(base.destinos)].filter((id) => ofrecidos.has(id));
  if (!destinos.length) return { ok: false, error: "invalido" };

  const respuestas = { ...base, destinos };
  const itinerario = buildItinerary(respuestas, catalogo);
  const referencias = referenciasDe(itinerario, catalogo);
  const score = calcularScore({ ...p, viajeros: base.viajeros, mes: base.mes, dias: base.dias, hotel: base.hotel, precioDesdeSoles: itinerario.precio.porPersona });
  const prueba = !correoActivo();

  let slug: string;
  try {
    slug = await crearItinerario({
      origen: "B",
      respuestas,
      fuenteCatalogo: fuente,
      itinerario,
      referencias,
      perfil: { presupuesto: p.presupuesto, ocasion: p.ocasion, vuelos: p.vuelos, cuenta: p.cuenta.trim(), contacto: { ...p.contacto, ig: p.contacto.ig.replace(/^@+/, "") }, score, ...(prueba && { prueba }) },
    });
  } catch (error) {
    console.error(error);
    return { ok: false, error: "guardado" };
  }

  // CRM y mails después de responder: la persona no espera por ellos.
  const tc = await getTranslations("comun");
  const ta = await getTranslations("armar");
  const nombres = itinerario.ruta.map((id) => referencias.destinos[id].nombre);
  const url = `${urlPublica()}/itinerario/${slug}/`;
  after(async () => {
    await avisarCrm({
      tipo: "lead",
      ref: slug,
      prueba,
      itinerario_url: url,
      contacto: p.contacto,
      viaje: {
        dias: base.dias, mes: base.mes, viajeros: base.viajeros,
        destinos: nombres,
        estilo: base.estilo, estilo_etiqueta: tc(`estilos.${base.estilo}.nombre`),
        hotel: base.hotel, hotel_etiqueta: tc(`hoteles.${base.hotel}.nombre`),
        presupuesto: p.presupuesto, presupuesto_etiqueta: ta(`presupuesto.opciones.${p.presupuesto}`),
        ocasion: p.ocasion, ocasion_etiqueta: ta(`ocasion.opciones.${p.ocasion}`),
        vuelos: p.vuelos, vuelos_etiqueta: ta(`vuelos.opciones.${p.vuelos}`),
        precio_desde_usd: score.precioDesdeUsd,
        cuenta: p.cuenta.trim(),
      },
      score: { score10: score.score10, total: score.total, categoria: score.categoria, accion: score.accion, desglose: score.desglose },
      utm_source: p.utm_source, utm_campaign: p.utm_campaign, referer: p.referer, duracion_segundos: p.duracion_segundos,
    });
    if (prueba) return;
    const correos = armarCorreos({
      nombre: p.contacto.nombre,
      dias: base.dias,
      ruta: listaNatural([...new Set(nombres)], " y "),
      urlItinerario: url,
      urlWhatsapp: `${urlPublica()}/wa/${slug}/`,
      precioPorPersona: soles.format(itinerario.precio.porPersona),
      precioUsd: score.precioDesdeUsd,
      conWhatsapp: score.categoria !== "frio",
    });
    const ahora = Date.now();
    const ids: { n: number; id: string; para: string }[] = [];
    for (const c of correos) {
      try {
        const id = await enviar({ para: p.contacto.email, asunto: c.asunto, html: c.html, texto: c.texto, enviarEn: new Date(ahora + c.minutos * 60000), etiquetas: { slug, n: String(c.n) } });
        ids.push({ n: c.n, id, para: p.contacto.email });
      } catch (e) {
        console.error(`Mail ${c.n} de ${slug}:`, e);
      }
    }
    await guardarCorreos(slug, ids).catch((e) => console.error(e));
    if (ids.length) await avisarCrm({ tipo: "evento", ref: slug, evento: "mail_enviado" });
  });

  return { ok: true, slug, prueba, nivel: score.categoria };
}

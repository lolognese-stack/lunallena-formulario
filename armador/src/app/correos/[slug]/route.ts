import { NextResponse } from "next/server";
import { urlPublica } from "@/lib/contacto";
import { armarCorreos } from "@/lib/correo/plantillas";
import { leerItinerario } from "@/lib/datos/itinerarios";
import { listaNatural, soles } from "@/lib/formato";

/**
 * Modo prueba: muestra los 5 mails que recibiría la persona (?n=1 a 5).
 * Solo para itinerarios armados en modo prueba (sin RESEND_API_KEY).
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await leerItinerario(slug).catch(() => null);
  if (!g?.perfil?.prueba) return new NextResponse("No disponible", { status: 404 });
  const n = Math.min(5, Math.max(1, Number(new URL(req.url).searchParams.get("n")) || 1));
  const nombres = g.itinerario.ruta.map((id) => g.referencias.destinos[id].nombre);
  const correos = armarCorreos({
    nombre: g.perfil.contacto.nombre,
    dias: g.respuestas.dias,
    ruta: listaNatural([...new Set(nombres)], " y "),
    urlItinerario: `${urlPublica()}/itinerario/${slug}/`,
    urlWhatsapp: `${urlPublica()}/wa/${slug}/`,
    precioPorPersona: soles.format(g.itinerario.precio.porPersona),
    precioUsd: g.perfil.score.precioDesdeUsd,
    conWhatsapp: g.perfil.score.categoria !== "frio",
  });
  const c = correos[n - 1];
  const dia = c.minutos < 60 ? `a los ${c.minutos} minutos` : `el día ${Math.round(c.minutos / 1440)}`;
  const barra = `<div style="font:13px/1.4 Inter,Arial,sans-serif;background:#161616;color:#fff;padding:10px 14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
<b>Vista previa · mail ${n} de 5</b><span style="color:#bbb">llega ${dia} · Asunto: ${c.asunto.replace(/</g, "&lt;")}</span>
<span style="margin-left:auto;display:flex;gap:6px">${correos.map((x) => `<a href="?n=${x.n}" style="color:${x.n === n ? "#FF7A00" : "#fff"};text-decoration:none;border:1px solid #444;border-radius:6px;padding:2px 9px">${x.n}</a>`).join("")}</span></div>`;
  return new NextResponse(c.html.replace(/<body([^>]*)>/, `<body$1>${barra}`), { headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" } });
}

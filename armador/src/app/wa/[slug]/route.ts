import { getTranslations } from "next-intl/server";
import { after, NextResponse } from "next/server";
import { enlaceWhatsApp, urlPublica } from "@/lib/contacto";
import { cancelar, correoActivo } from "@/lib/correo/resend";
import { avisarCrm } from "@/lib/crm";
import { leerItinerario } from "@/lib/datos/itinerarios";

/**
 * Botón de WhatsApp de los mails y de la página del itinerario. Anota el clic en el CRM,
 * corta la secuencia de mails (ya escribió: no hace falta insistir) y redirige a wa.me
 * con un mensaje que trae el link del itinerario.
 */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guardado = await leerItinerario(slug).catch(() => null);
  if (!guardado) return NextResponse.redirect(enlaceWhatsApp("Hola, quiero armar mi viaje a Cusco."), 302);

  const t = await getTranslations("itinerario");
  const nombres = guardado.itinerario.ruta.map((id) => guardado.referencias.destinos[id].nombre);
  const mensaje = t("mensajeWhatsapp", { dias: guardado.respuestas.dias, ruta: nombres.join(" – "), link: `${urlPublica()}/itinerario/${slug}/` });

  after(async () => {
    await avisarCrm({ tipo: "evento", ref: slug, evento: "click_whatsapp" });
    if (correoActivo()) for (const c of guardado.perfil?.correos ?? []) await cancelar(c.id);
  });
  return NextResponse.redirect(enlaceWhatsApp(mensaje), 302);
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Avisos, LineaDeTiempo } from "@/components/itinerario/LineaDeTiempo";
import { Boton } from "@/components/ui/Boton";
import { Encabezado } from "@/components/ui/Encabezado";
import { Icono, IconoWhatsApp, type NombreIcono } from "@/components/ui/Icono";
import { Pie } from "@/components/ui/Pie";
import { BASE } from "@/lib/contacto";
import { veWhatsapp } from "@/lib/score";
import type { ItinerarioGuardado } from "@/lib/datos/guardado";
import { leerItinerario } from "@/lib/datos/itinerarios";
import { listaNatural, soles } from "@/lib/formato";

export async function generateMetadata({ params }: PageProps<"/itinerario/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const guardado = await leerItinerario(slug);
  const t = await getTranslations("itinerario");
  // noindex: lo hereda del layout; el link compartible no debe aparecer en buscadores.
  return guardado ? { title: t("metaTitulo", { dias: guardado.respuestas.dias }) } : {};
}

export default function PaginaItinerario({ params }: PageProps<"/itinerario/[slug]">) {
  return (
    <>
      <Encabezado />
      <main className="flex-1">
        <Suspense fallback={<Cargando />}>
          <Contenido params={params} />
        </Suspense>
      </main>
      <Pie />
    </>
  );
}

function Cargando() {
  return (
    <div className="wrap grid gap-4 py-16" aria-busy="true">
      <div className="h-6 w-40 animate-pulse rounded-full bg-sand" />
      <div className="h-12 w-3/4 animate-pulse rounded-sm bg-sand" />
      <div className="h-64 animate-pulse rounded-panel bg-sand" />
    </div>
  );
}

async function Contenido({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guardado = await leerItinerario(slug);
  if (!guardado) notFound();
  return <Itinerario guardado={guardado} />;
}

async function Itinerario({ guardado }: { guardado: ItinerarioGuardado }) {
  const t = await getTranslations("itinerario");
  const tc = await getTranslations("comun");
  const { respuestas: r, itinerario, referencias } = guardado;
  const nombres = itinerario.ruta.map((id) => referencias.destinos[id].nombre);
  // En el título cada destino va una vez, aunque se vuelva a él (Cusco → Machu Picchu → Cusco).
  const ruta = listaNatural([...new Set(nombres)], t("y"));
  // El botón pasa por /wa/[slug]: anota el clic en el CRM y corta la secuencia de mails.
  // Los leads fríos ven WhatsApp desde el día 8 (llega con el último mail).
  const conWhatsapp = veWhatsapp(guardado.perfil?.score.categoria, guardado.creadoEn);

  const datos: { icono: NombreIcono; texto: string }[] = [
    { icono: "calendar", texto: (tc.raw("meses") as string[])[r.mes - 1] },
    ...(r.estilo ? [{ icono: "mountain" as const, texto: tc(`estilos.${r.estilo}.nombre`) }] : []),
    { icono: "users", texto: t("resumen.viajeros", { n: r.viajeros }) },
    { icono: "bed", texto: t("resumen.hotel", { hotel: tc(`hoteles.${r.hotel}.nombre`) }) },
  ];

  return (
    <>
      <section className="bg-sand pt-[clamp(32px,5vw,64px)] pb-[clamp(28px,4vw,48px)]">
        <div className="wrap grid gap-4">
          <span className="eyebrow">{t(`eyebrow.${guardado.origen}`)}</span>
          <h1 className="max-w-[22ch] text-[clamp(1.9rem,4.4vw,3.2rem)]">{t("titulo", { dias: r.dias, ruta })}</h1>
          <ul className="flex flex-wrap gap-2">
            {datos.map(({ icono, texto }) => (
              <li key={icono} className="inline-flex items-center gap-2 rounded-sm border border-line bg-card px-3 py-2 text-[0.88rem] font-semibold">
                <Icono nombre={icono} className="size-4 text-orange-ink" /> {texto}
              </li>
            ))}
          </ul>
          {guardado.adjunto && (
            <p className="flex w-fit items-center gap-2 rounded-sm border border-line bg-card px-3.5 py-2.5 text-[0.88rem] text-ink-2">
              <Icono nombre="file" className="size-4 text-orange-ink" /> {t("adjunto")}
            </p>
          )}
          {guardado.fuenteCatalogo === "prueba" && (
            <p className="w-fit rounded-sm border border-dashed border-warn-line bg-warn-bg px-3.5 py-2.5 text-[0.88rem] text-warn-ink">
              {t("catalogoPrueba")}
            </p>
          )}
        </div>
      </section>

      <div className="wrap grid items-start gap-[clamp(24px,4vw,48px)] pt-[clamp(28px,4vw,48px)] min-[1000px]:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 gap-6">
          <Avisos avisos={itinerario.avisos} />
          <LineaDeTiempo itinerario={itinerario} referencias={referencias} />
        </div>

        {/* Resumen y precio: arriba en celular, columna fija en escritorio */}
        <aside className="grid gap-5 rounded-panel bg-ink p-6 text-white max-[999px]:order-first min-[1000px]:sticky min-[1000px]:top-24">
          <div className="grid gap-2">
            <span className="eyebrow text-orange-light [--eyebrow-line:var(--color-orange-light)]">{t("precio.titulo")}</span>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-head text-[1.1rem] font-light">
              {nombres.map((nombre, i) => (
                <span key={`${i}-${nombre}`} className="inline-flex items-center gap-2">
                  {i > 0 && <Icono nombre="arrow" className="size-4 text-orange" />}
                  {nombre}
                </span>
              ))}
            </p>
          </div>
          <div className="grid gap-1 border-t border-white/14 pt-5">
            <small className="text-[0.85rem] text-white/70">{t("precio.desde")}</small>
            <b className="font-head text-[2.4rem] leading-none font-light">
              {soles.format(itinerario.precio.porPersona)}{" "}
              <span className="text-[1rem] font-semibold text-white/70">{t("precio.porPersona")}</span>
            </b>
            <p className="mt-1 text-[0.9rem] font-semibold">
              {t("precio.total", { total: soles.format(itinerario.precio.total), viajeros: r.viajeros })}
            </p>
            <p className="text-[0.85rem] text-white/70">
              {t("precio.desglose", { experiencias: soles.format(itinerario.precio.experiencias), hoteles: soles.format(itinerario.precio.hoteles) })}
            </p>
            <p className="mt-2 text-[0.85rem] text-white/70">{t("precio.nota")}</p>
          </div>
          <div className="grid gap-2.5">
            <Boton disabled bloque>
              {t("acciones.cotizar")} · {t("acciones.proximamente")}
            </Boton>
            {conWhatsapp && (
              <Boton href={`${BASE}/wa/${guardado.slug}/`} externo variante="claro" bloque>
                <IconoWhatsApp /> {t("acciones.whatsapp")}
              </Boton>
            )}
            <Boton href="/" variante="claro" bloque>
              {t("acciones.otro")}
            </Boton>
          </div>
        </aside>
      </div>
    </>
  );
}

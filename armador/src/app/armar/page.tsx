import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Asistente } from "@/components/armar/Asistente";
import { Encabezado } from "@/components/ui/Encabezado";
import { obtenerCatalogo } from "@/lib/datos/catalogo";
import { destinosOfrecidos } from "@/lib/datos/mapeo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("armar");
  return { title: t("metaTitulo") };
}

// Flujo B: 4 pasos y, al final, la Server Action armarViaje (acciones.ts).
export default async function Armar() {
  const t = await getTranslations("armar");
  const { catalogo, fuente } = await obtenerCatalogo();
  const destinos = destinosOfrecidos(catalogo).map((d) => ({ id: d.id, nombre: d.nombre, altitudM: d.altitudM, imagenUrl: d.imagenUrl ?? null }));

  return (
    <>
      <Encabezado />
      <main className="flex-1">
        {fuente === "prueba" && (
          <p className="bg-warn-bg px-4 py-2 text-center text-[0.82rem] text-warn-ink">{t("catalogoPrueba")}</p>
        )}
        <Asistente destinos={destinos} />
      </main>
    </>
  );
}

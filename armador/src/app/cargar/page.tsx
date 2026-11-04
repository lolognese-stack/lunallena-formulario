import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Constructor } from "@/components/cargar/Constructor";
import { Encabezado } from "@/components/ui/Encabezado";
import { obtenerCatalogo } from "@/lib/datos/catalogo";
import { destinosOfrecidos } from "@/lib/datos/mapeo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cargar");
  return { title: t("metaTitulo") };
}

// Flujo A y combinado: constructor día por día y, al final, la Server Action cargarViaje (acciones.ts).
export default async function Cargar() {
  const t = await getTranslations("armar");
  const { catalogo, fuente } = await obtenerCatalogo();

  // Aquí van todos los destinos (aunque tengan pocas experiencias): el cliente puede escribir lo que hará.
  const destinos = [...catalogo.destinos]
    .sort((a, b) => Number(b.esNucleo) - Number(a.esNucleo) || a.ordenRuta - b.ordenRuta)
    .map((d) => ({ id: d.id, nombre: d.nombre }));
  const experiencias = catalogo.experiencias.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    destinoId: e.destinoId,
    dias: e.dias,
    precioDesde: e.precioDesde,
    terminaEnId: e.terminaEnId,
  }));
  const ofrecidos = destinosOfrecidos(catalogo).map((d) => ({ id: d.id, nombre: d.nombre }));

  return (
    <>
      <Encabezado />
      <main className="flex-1">
        {fuente === "prueba" && (
          <p className="bg-warn-bg px-4 py-2 text-center text-[0.82rem] text-warn-ink">{t("catalogoPrueba")}</p>
        )}
        <Constructor destinos={destinos} experiencias={experiencias} ofrecidos={ofrecidos} />
      </main>
    </>
  );
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Quiz } from "@/components/quiz/Quiz";
import { Encabezado } from "@/components/ui/Encabezado";
import { obtenerCatalogo } from "@/lib/datos/catalogo";
import { tarjetasOfrecidas } from "@/lib/leads/experiencias";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("quiz");
  return { title: t("metaTitulo") };
}

// El armador es directamente el quiz v2 (src/components/quiz/Quiz.tsx).
export default async function Inicio() {
  const t = await getTranslations("quiz");
  const { catalogo, fuente } = await obtenerCatalogo();

  return (
    <>
      <Encabezado />
      <main className="flex-1">
        {fuente === "prueba" && <p className="bg-warn-bg px-4 py-2 text-center text-[0.82rem] text-warn-ink">{t("catalogoPrueba")}</p>}
        <Quiz tarjetas={tarjetasOfrecidas(catalogo)} />
      </main>
    </>
  );
}

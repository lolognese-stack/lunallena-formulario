import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Laboratorio } from "@/components/prueba/Laboratorio";
import { Encabezado } from "@/components/ui/Encabezado";
import { Pie } from "@/components/ui/Pie";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("prueba");
  return { title: t("metaTitulo") };
}

// Vista interna para probar el motor con el catálogo de prueba, antes de la Fase 3.
export default async function PruebaMotor() {
  const t = await getTranslations("prueba");
  return (
    <>
      <Encabezado />
      <main className="flex-1">
        <section className="bg-sand pt-[clamp(40px,6vw,72px)] pb-[clamp(32px,5vw,56px)]">
          <div className="wrap">
            <div className="grid max-w-[760px] gap-3.5">
              <span className="eyebrow">{t("eyebrow")}</span>
              <h1 className="text-[clamp(2rem,4.4vw,3.2rem)]">{t("titulo")}</h1>
              <p className="lead">{t("lead")}</p>
              <p className="w-fit rounded-sm border border-dashed border-warn-line bg-warn-bg px-3.5 py-2.5 text-[0.88rem] text-[#5c4500]">
                {t("nota")}
              </p>
            </div>
          </div>
        </section>
        <div className="pt-[clamp(28px,4vw,48px)]">
          <Laboratorio />
        </div>
      </main>
      <Pie />
    </>
  );
}

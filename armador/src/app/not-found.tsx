import { getTranslations } from "next-intl/server";
import { Boton } from "@/components/ui/Boton";
import { Encabezado } from "@/components/ui/Encabezado";
import { Pie } from "@/components/ui/Pie";

export default async function NoEncontrado() {
  const t = await getTranslations("itinerario.noEncontrado");
  return (
    <>
      <Encabezado />
      <main className="wrap grid flex-1 content-center justify-items-start gap-4 py-24">
        <span className="eyebrow">404</span>
        <h1 className="text-[clamp(2rem,4.4vw,3rem)]">{t("titulo")}</h1>
        <p className="lead">{t("texto")}</p>
        <Boton href="/">{t("boton")}</Boton>
      </main>
      <Pie />
    </>
  );
}

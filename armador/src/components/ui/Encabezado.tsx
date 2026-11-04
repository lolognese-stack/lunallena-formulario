import { getTranslations } from "next-intl/server";
import { SITIO_PRINCIPAL } from "@/lib/contacto";
import { Boton } from "./Boton";
import { EncabezadoInteractivo } from "./EncabezadoInteractivo";
import { Marca } from "./Marca";

export async function Encabezado() {
  const t = await getTranslations("encabezado");

  const enlaces = [
    { href: "/", texto: t("nav.planificador"), actual: true },
    { href: SITIO_PRINCIPAL, texto: t("nav.paquetes") },
    { href: "#contacto", texto: t("nav.contacto") },
  ];

  return (
    <EncabezadoInteractivo
      marca={<Marca soloLogo />}
      enlaces={enlaces}
      navAria={t("navAria")}
      abrirMenu={t("abrirMenu")}
      cerrarMenu={t("cerrarMenu")}
      accion={
        <Boton href="/armar" className="max-[900px]:hidden">
          {t("consultar")}
        </Boton>
      }
    />
  );
}

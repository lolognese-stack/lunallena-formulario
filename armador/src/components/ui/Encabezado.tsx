import { getTranslations } from "next-intl/server";
import { BASE } from "@/lib/contacto";
import { Boton } from "./Boton";
import { EncabezadoInteractivo } from "./EncabezadoInteractivo";
import { Marca } from "./Marca";

export async function Encabezado() {
  const t = await getTranslations("encabezado");

  // Mismo menú que el sitio. El armador vive en lunallenatravel.vercel.app/armador, así que
  // las rutas sin BASE van a las páginas del sitio.
  const enlaces = [
    { href: "/", texto: t("nav.inicio") },
    { href: "/paquetes/", texto: t("nav.paquetes") },
    { href: `${BASE}/`, texto: t("nav.planificador"), actual: true },
    { href: "/nosotros/", texto: t("nav.nosotros") },
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

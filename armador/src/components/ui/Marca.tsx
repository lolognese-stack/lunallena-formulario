import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BASE } from "@/lib/contacto";

/** Logo con nombre, como en el pie del prototipo. `soloLogo` lo deja como en el encabezado. */
export async function Marca({ soloLogo = false, claro = false }: { soloLogo?: boolean; claro?: boolean }) {
  const t = await getTranslations("marca");
  return (
    <Link href="/" className="inline-flex items-center gap-3 no-underline">
      <Image
        src={`${BASE}/logo.svg`}
        alt={soloLogo ? t("logoAlt") : ""}
        width={soloLogo ? 48 : 42}
        height={soloLogo ? 48 : 42}
        className="rounded-[11px]"
        priority={soloLogo}
      />
      {!soloLogo && (
        <span className={`font-head text-[1.12rem] leading-none font-extrabold tracking-[-0.02em] ${claro ? "text-white" : ""}`}>
          {t("nombre")}
          <small className={`mt-1 block text-[0.62rem] font-bold tracking-[0.32em] ${claro ? "text-white/60" : "text-muted"}`}>
            {t("sufijo")}
          </small>
        </span>
      )}
    </Link>
  );
}

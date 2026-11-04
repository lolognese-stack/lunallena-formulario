import { getTranslations } from "next-intl/server";
import { enlaceWhatsApp, SITIO_PRINCIPAL } from "@/lib/contacto";
import { Marca } from "./Marca";

export async function Pie() {
  const t = await getTranslations("pie");
  const tWa = await getTranslations("whatsapp");
  const wa = enlaceWhatsApp(tWa("general"));

  const viajes = ["machuPicchu", "toursCusco", "treks", "paquetesPeru", "retiros"] as const;
  const enlace = "no-underline hover:text-orange";

  return (
    <>
      <footer id="contacto" className="mt-[clamp(64px,10vw,128px)] bg-ink pt-18 pb-8 text-[0.95rem] text-white/78">
        <div className="wrap">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-8 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
            <div>
              <Marca claro />
              <p className="mt-4 max-w-[34ch]">{t("descripcion")}</p>
            </div>
            <div>
              <h4 className="mb-3.5 text-[0.95rem] text-white">{t("viajes.titulo")}</h4>
              <ul className="grid gap-2">
                {viajes.map((v) => (
                  <li key={v}>
                    <a className={enlace} href={SITIO_PRINCIPAL}>
                      {t(`viajes.${v}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-3.5 text-[0.95rem] text-white">{t("oficinas.titulo")}</h4>
              <ul className="grid gap-2">
                <li>{t("oficinas.cusco")}</li>
                <li>{t("oficinas.francia")}</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3.5 text-[0.95rem] text-white">{t("contacto.titulo")}</h4>
              <ul className="grid gap-2">
                <li>
                  <a className={enlace} href={wa} target="_blank" rel="noopener">
                    {t("contacto.whatsapp")}
                  </a>
                </li>
                <li>
                  <a className={enlace} href="tel:+51984228502">
                    {t("contacto.telefono")}
                  </a>
                </li>
                <li>
                  <a className={enlace} href="tel:+3378304954">
                    {t("contacto.francia")}
                  </a>
                </li>
                <li>
                  <a className={enlace} href="mailto:reservas@lunallenatravel.com">
                    {t("contacto.reservas")}
                  </a>
                </li>
                <li>
                  <a className={enlace} href="mailto:info@lunallenatravel.com">
                    {t("contacto.info")}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-wrap justify-between gap-x-6 gap-y-3 border-t border-white/12 pt-6 text-[0.85rem]">
            <span>{t("legal")}</span>
            <span>{t("legalLinks")}</span>
          </div>
        </div>
      </footer>
    </>
  );
}

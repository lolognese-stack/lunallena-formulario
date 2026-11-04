import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Boton } from "@/components/ui/Boton";
import { Encabezado } from "@/components/ui/Encabezado";
import { Icono, type NombreIcono } from "@/components/ui/Icono";
import { Pie } from "@/components/ui/Pie";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { BASE } from "@/lib/contacto";

const CONFIANZA: { clave: "anios" | "formal" | "oficinas" | "respuesta"; icono: NombreIcono }[] = [
  { clave: "anios", icono: "award" },
  { clave: "formal", icono: "shield" },
  { clave: "oficinas", icono: "building" },
  { clave: "respuesta", icono: "users" },
];

// "Ya tengo mi itinerario" y "Tengo una parte" van al mismo constructor: la diferencia es
// si al final se ve tal cual o se usa "Completar los días que faltan".
const CAMINOS: { clave: "cargar" | "parte" | "armar"; icono: NombreIcono; href: string }[] = [
  { clave: "cargar", icono: "file", href: "/cargar" },
  { clave: "parte", icono: "puzzle", href: "/cargar" },
  { clave: "armar", icono: "route", href: "/armar" },
];

export default async function Inicio() {
  const t = await getTranslations("inicio");

  return (
    <>
      <Encabezado />
      <main className="flex-1">
        {/* Portada como las de /paquetes: foto, degradé, migas, título liviano y filete dorado */}
        <section className="relative isolate flex min-h-[clamp(340px,42vw,480px)] items-end overflow-hidden text-white after:absolute after:inset-x-0 after:bottom-0 after:h-1.5 after:bg-gold">
          <Image src={`${BASE}/hero.jpg`} alt={t("heroAlt")} fill priority sizes="100vw" className="-z-20 object-cover" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(20,16,12,.15)_0%,rgba(20,16,12,.35)_45%,rgba(20,16,12,.85)_100%)]" />
          <div className="wrap grid justify-items-start gap-2.5 pt-10 pb-11">
            <nav aria-label={t("migasAria")} className="text-[0.88rem] text-white/75">
              <a href="/" className="text-white no-underline hover:underline">{t("migasInicio")}</a>
              <span className="mx-2">/</span>
              <span>{t("migasActual")}</span>
            </nav>
            <span className="eyebrow text-orange-pale">{t("eyebrow")}</span>
            <h1 className="max-w-[16ch] text-white">{t.rich("titulo", { em: (c) => <em className="font-normal not-italic">{c}</em> })}</h1>
            <p className="max-w-[60ch] text-white/88">{t("lead")}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Boton href="/armar">
                {t("ctaPrincipal")} <Icono nombre="arrow" />
              </Boton>
              <Boton href="#caminos" variante="claro">
                {t("ctaCaminos")}
              </Boton>
            </div>
          </div>
        </section>

        {/* Franja de confianza (tema premium: sin caja, líneas arriba y abajo, centrada) */}
        <div className="wrap pt-14">
          <div
            aria-label={t("confianza.aria")}
            className="grid grid-cols-4 border-y border-line max-[960px]:grid-cols-2"
          >
            {CONFIANZA.map(({ clave, icono }, i) => (
              <div
                key={clave}
                className={`flex flex-col items-center gap-2 px-5 py-7 text-center max-[520px]:px-3 ${
                  i > 0 ? "border-l border-line" : ""
                } ${i === 2 ? "max-[960px]:border-l-0" : ""} ${i >= 2 ? "max-[960px]:border-t" : ""}`}
              >
                <Icono nombre={icono} className="size-[22px] text-orange-ink" />
                <b className="block font-head text-[2rem] leading-none font-light tracking-[-0.03em] max-[520px]:text-[1.4rem]">
                  {t(`confianza.${clave}.titulo`)}
                </b>
                <span className="block max-w-[26ch] text-[0.85rem] leading-[1.45] text-muted">
                  {t(`confianza.${clave}.texto`)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tres caminos */}
        <section id="caminos" className="section-y scroll-mt-[72px]">
          <div className="wrap">
            <div className="mb-11 grid max-w-[720px] gap-3.5">
              <span className="eyebrow">{t("caminos.eyebrow")}</span>
              <h2>{t("caminos.titulo")}</h2>
              <p className="lead">{t("caminos.lead")}</p>
            </div>
            <div className="grid grid-cols-3 gap-[22px] max-[900px]:grid-cols-1">
              {CAMINOS.map(({ clave, icono, href }) => (
                <Tarjeta key={clave} className="grid content-start gap-4">
                  <Icono nombre={icono} className="size-[26px] text-orange-ink" />
                  <h3>{t(`caminos.${clave}.titulo`)}</h3>
                  <p className="text-muted">{t(`caminos.${clave}.texto`)}</p>
                  <Boton href={href} variante={clave === "armar" ? "primario" : "contorno"} className="w-fit">
                    {t("caminos.empezar")} <Icono nombre="arrow" />
                  </Boton>
                </Tarjeta>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="wrap">
          <div className="relative grid grid-cols-[1fr_auto] items-center gap-6 overflow-hidden rounded-band bg-ink p-[clamp(32px,6vw,64px)] text-bg max-[760px]:grid-cols-1">
            <div className="relative">
              <h2 className="max-w-[18ch] text-bg">{t("cta.titulo")}</h2>
              <p className="mt-2.5 max-w-[48ch] text-bg/75">{t("cta.texto")}</p>
            </div>
            <Boton href="/armar" className="relative">
              {t("cta.boton")} <Icono nombre="arrow" />
            </Boton>
          </div>
        </section>
      </main>
      <Pie />
    </>
  );
}

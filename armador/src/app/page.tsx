import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Boton } from "@/components/ui/Boton";
import { Encabezado } from "@/components/ui/Encabezado";
import { Icono, type NombreIcono } from "@/components/ui/Icono";
import { Pie } from "@/components/ui/Pie";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { BASE } from "@/lib/contacto";

const FOTO_HERO = "https://lunallenatravel.com/wp-content/uploads/2023/11/mapi5-1536x592.jpg";

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
        {/* Hero */}
        <section className="relative isolate grid min-h-[min(88vh,820px)] items-end overflow-hidden text-white">
          <Image
            src={FOTO_HERO}
            alt={t("heroAlt")}
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,10,10,.25)_0%,rgba(10,10,10,.12)_35%,rgba(10,10,10,.72)_100%)]" />
          <div className="wrap">
            <div className="grid max-w-[760px] gap-[22px] pt-[140px] pb-[150px]">
              <span className="eyebrow text-orange-pale [--eyebrow-line:var(--color-orange-pale)]">{t("eyebrow")}</span>
              <h1>{t.rich("titulo", { em: (c) => <em className="text-orange not-italic">{c}</em> })}</h1>
              <p className="max-w-[56ch] text-[1.15rem] text-white/90">{t("lead")}</p>
              <div className="mt-1.5 flex flex-wrap gap-3">
                <Boton href="#caminos">
                  {t("ctaPrincipal")} <Icono nombre="arrow" />
                </Boton>
              </div>
            </div>
          </div>
        </section>

        {/* Franja de confianza */}
        <div className="relative z-5 -mt-[84px] max-[520px]:-mt-14">
          <div className="wrap">
            <div
              aria-label={t("confianza.aria")}
              className="grid grid-cols-4 rounded-panel bg-white shadow-float max-[960px]:grid-cols-2"
            >
              {CONFIANZA.map(({ clave, icono }, i) => (
                <div
                  key={clave}
                  className={`flex items-start gap-3.5 px-6 py-[26px] max-[520px]:flex-col max-[520px]:gap-2.5 max-[520px]:px-4 max-[520px]:py-[18px] ${
                    i > 0 ? "border-l border-line" : ""
                  } ${i === 2 ? "max-[960px]:border-l-0" : ""} ${i >= 2 ? "max-[960px]:border-t" : ""}`}
                >
                  <div className="grid size-[46px] shrink-0 place-items-center rounded-[14px] bg-orange-soft text-orange-ink">
                    <Icono nombre={icono} className="size-[22px]" />
                  </div>
                  <div>
                    <b className="block font-head text-[1.35rem] leading-[1.1] font-extrabold tracking-[-0.02em] max-[520px]:text-[1.1rem]">
                      {t(`confianza.${clave}.titulo`)}
                    </b>
                    <span className="mt-1 block text-[0.88rem] leading-[1.4] text-muted">
                      {t(`confianza.${clave}.texto`)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
                  <div className="grid size-[46px] place-items-center rounded-[14px] bg-orange-soft text-orange-ink">
                    <Icono nombre={icono} className="size-[22px]" />
                  </div>
                  <h3>{t(`caminos.${clave}.titulo`)}</h3>
                  <p className="text-muted">{t(`caminos.${clave}.texto`)}</p>
                  <Boton href={href} className="w-fit">
                    {t("caminos.empezar")} <Icono nombre="arrow" />
                  </Boton>
                </Tarjeta>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="wrap">
          <div className="relative grid grid-cols-[1fr_auto] items-center gap-6 overflow-hidden rounded-band bg-orange p-[clamp(32px,6vw,64px)] max-[760px]:grid-cols-1">
            <Image
              src={`${BASE}/logo.svg`}
              alt=""
              width={280}
              height={280}
              className="pointer-events-none absolute -top-15 -right-15 opacity-12"
            />
            <div className="relative">
              <h2 className="max-w-[18ch]">{t("cta.titulo")}</h2>
              <p className="mt-2.5 max-w-[48ch] text-ink-2">{t("cta.texto")}</p>
            </div>
            <Boton href="/armar" variante="oscuro" className="relative">
              {t("cta.boton")} <Icono nombre="arrow" />
            </Boton>
          </div>
        </section>
      </main>
      <Pie />
    </>
  );
}

"use client";

import { useTranslations } from "next-intl";

/** Autoridad antes de pedir los datos (mismos datos que /nosotros del sitio). */
export function Autoridad() {
  const t = useTranslations("quiz.autoridad");
  return (
    <div aria-label={t("aria")} className="grid gap-3">
      <dl className="grid grid-cols-2 border-y border-line min-[760px]:grid-cols-4">
        {(["viajeros", "anios", "tripadvisor", "formal"] as const).map((k, i) => (
          <div
            key={k}
            className={`grid content-start gap-1 px-3 py-4 min-[760px]:px-4 ${i % 2 === 1 ? "border-l border-line" : ""} ${i >= 2 ? "border-t border-line min-[760px]:border-t-0" : ""} ${
              i === 2 ? "min-[760px]:border-l" : ""
            }`}
          >
            <dt className="flex items-baseline gap-1.5 font-head text-[1.35rem] leading-none font-light tracking-[-0.03em] min-[760px]:text-[1.6rem]">
              {t(`${k}.dato`)}
              {k === "tripadvisor" && (
                <span aria-hidden="true" className="text-[0.9rem] tracking-[0.1em] text-orange-ink">
                  ★★★★★
                </span>
              )}
            </dt>
            <dd className="text-[0.82rem] leading-[1.4] text-muted">{t(`${k}.texto`)}</dd>
          </div>
        ))}
      </dl>
      <figure className="tarjeta-pkg grid gap-2 px-4 py-3.5">
        <blockquote className="text-[0.95rem] leading-relaxed text-ink-2">“{t("cita")}”</blockquote>
        <figcaption className="text-[0.78rem] text-muted">
          {t("citaAutor")} · {t("guias")}
        </figcaption>
      </figure>
    </div>
  );
}

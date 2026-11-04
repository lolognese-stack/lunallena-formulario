import type { ComponentProps } from "react";

export type VarianteTarjeta = "blanca" | "tinta" | "naranja" | "arena";

const VARIANTES: Record<VarianteTarjeta, string> = {
  blanca: "bg-white border border-line",
  tinta: "bg-ink text-white",
  naranja: "bg-orange text-ink",
  arena: "bg-sand border border-line",
};

type Props = ComponentProps<"div"> & {
  variante?: VarianteTarjeta;
  /** Sombra suave del prototipo (tarjetas flotantes, resumen). */
  elevada?: boolean;
  /** Sin relleno interno, para tarjetas con foto a sangre. */
  sinRelleno?: boolean;
};

export function Tarjeta({ variante = "blanca", elevada, sinRelleno, className = "", ...resto }: Props) {
  const clases = [
    "rounded-panel",
    VARIANTES[variante],
    elevada ? "shadow-card" : "",
    sinRelleno ? "overflow-hidden" : "p-[clamp(24px,4vw,40px)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <div className={clases} {...resto} />;
}

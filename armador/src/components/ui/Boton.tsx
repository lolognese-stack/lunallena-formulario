import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export type VarianteBoton = "primario" | "oscuro" | "contorno" | "claro" | "whatsapp";

const BASE =
  "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2.5 rounded-sm px-6 font-head text-[0.98rem] leading-none font-bold no-underline transition-[background,transform,box-shadow,color] duration-200 ease-marca active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTES: Record<VarianteBoton, string> = {
  primario: "bg-orange text-ink shadow-orange hover:bg-orange-hover hover:shadow-orange-hover",
  oscuro: "bg-ink text-white hover:bg-ink-hover",
  contorno: "bg-transparent text-ink shadow-[inset_0_0_0_1.5px_var(--color-line)] hover:shadow-[inset_0_0_0_1.5px_var(--color-ink)]",
  claro: "bg-white/14 text-white shadow-[inset_0_0_0_1.5px_rgba(255,255,255,.55)] backdrop-blur-[6px] hover:bg-white/24",
  // Igual que "contorno" pero con el ícono en verde WhatsApp (encabezado del prototipo).
  whatsapp:
    "bg-transparent text-ink shadow-[inset_0_0_0_1.5px_var(--color-line)] hover:shadow-[inset_0_0_0_1.5px_var(--color-ink)] [&>svg]:text-[#1fa855]",
};

export function clasesBoton(variante: VarianteBoton = "primario", bloque = false, extra = "") {
  return [BASE, VARIANTES[variante], bloque ? "w-full" : "", extra].filter(Boolean).join(" ");
}

type Comunes = { variante?: VarianteBoton; bloque?: boolean; children: ReactNode };

type PropsBoton = Comunes & ComponentProps<"button"> & { href?: undefined };
type PropsEnlace = Comunes & Omit<ComponentProps<typeof Link>, "href"> & { href: string; externo?: boolean };

/** Botón de marca. Con `href` se renderiza como enlace; con `externo` abre en otra pestaña. */
export function Boton(props: PropsBoton | PropsEnlace) {
  if (props.href !== undefined) {
    const { variante, bloque, className, externo, href, children, ...resto } = props as PropsEnlace;
    const clases = clasesBoton(variante, bloque, className);
    if (externo) {
      return (
        <a href={href} target="_blank" rel="noopener" className={clases} {...(resto as ComponentProps<"a">)}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={clases} {...resto}>
        {children}
      </Link>
    );
  }
  const { variante, bloque, className, type = "button", children, ...resto } = props as PropsBoton;
  return (
    <button type={type} className={clasesBoton(variante, bloque, className)} {...resto}>
      {children}
    </button>
  );
}

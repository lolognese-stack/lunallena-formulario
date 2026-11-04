"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Icono } from "./Icono";

type Enlace = { href: string; texto: string; actual?: boolean };

type Props = {
  marca: ReactNode;
  accion: ReactNode;
  enlaces: Enlace[];
  navAria: string;
  abrirMenu: string;
  cerrarMenu: string;
};

// Parte cliente del encabezado: borde al hacer scroll y menú desplegable en celular.
export function EncabezadoInteractivo({ marca, accion, enlaces, navAria, abrirMenu, cerrarMenu }: Props) {
  const [conScroll, setConScroll] = useState(false);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const alScroll = () => setConScroll(window.scrollY > 8);
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/88 backdrop-blur-[14px] backdrop-saturate-[1.4] transition-[border-color,box-shadow] duration-300 ${
        conScroll ? "border-line shadow-[0_6px_24px_-18px_rgba(0,0,0,.35)]" : "border-transparent"
      }`}
    >
      <div className="wrap flex h-[72px] items-center gap-7">
        {marca}
        <nav
          id="nav"
          aria-label={navAria}
          className={`ml-auto gap-1.5 min-[901px]:flex ${
            abierto
              ? "absolute inset-x-0 top-[72px] flex flex-col border-b border-line bg-white px-4 pt-3 pb-5 shadow-card"
              : "hidden"
          }`}
        >
          {enlaces.map((e) => (
            <a
              key={e.href}
              href={e.href}
              aria-current={e.actual ? "page" : undefined}
              onClick={() => setAbierto(false)}
              className="rounded-full px-3.5 py-2.5 text-[0.95rem] font-semibold text-ink-2 no-underline transition-colors hover:bg-orange-soft hover:text-ink aria-[current=page]:bg-orange-soft aria-[current=page]:text-ink max-[900px]:px-3 max-[900px]:py-3.5 max-[900px]:text-[1.05rem]"
            >
              {e.texto}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2.5 max-[900px]:ml-auto">
          {accion}
          <button
            type="button"
            className="grid size-11 cursor-pointer place-items-center rounded-sm bg-sand min-[901px]:hidden"
            aria-label={abierto ? cerrarMenu : abrirMenu}
            aria-expanded={abierto}
            aria-controls="nav"
            onClick={() => setAbierto((v) => !v)}
          >
            <Icono nombre={abierto ? "x" : "menu"} className="size-[22px]" />
          </button>
        </div>
      </div>
    </header>
  );
}

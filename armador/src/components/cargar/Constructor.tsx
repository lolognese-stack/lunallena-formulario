"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { cargarViaje } from "@/app/cargar/acciones";
import { Armando, conEsperaMinima } from "@/components/armar/Armando";
import { Contador, SelectorHotel, SelectorMes } from "@/components/armar/Controles";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import type { Carga } from "@/lib/datos/carga";
import { MAX_DIAS_VIAJE } from "@/lib/datos/carga";
import type { CategoriaHotel } from "@/lib/motor";
import { Adjuntar, type EstadoAdjunto } from "./Adjuntar";
import { DiaEditor, type Bloque, type DestinoCarga, type ExperienciaCarga } from "./DiaEditor";
import { DialogoCompletar, type PedidoCompletar } from "./DialogoCompletar";

type Problema = "mes" | "vacio" | "subiendo" | "adjunto" | "guardado";

/** Borrador en este navegador: si la página se recarga, no se pierde lo cargado. */
const CLAVE_BORRADOR = "ll_cargar_borrador_v1";
interface Borrador {
  bloques: Bloque[];
  mes: number | null;
  viajeros: number;
  hotel: CategoriaHotel;
  adjunto: EstadoAdjunto;
}

// Solo se llama desde eventos (no durante el render, que se prerenderiza).
const nuevaClave = () => crypto.randomUUID();

export function Constructor({
  destinos,
  experiencias,
  ofrecidos,
}: {
  destinos: DestinoCarga[];
  experiencias: ExperienciaCarga[];
  /** Destinos que el motor puede sumar al completar (los de /armar). */
  ofrecidos: DestinoCarga[];
}) {
  const t = useTranslations("cargar");
  const ta = useTranslations("armar");
  const router = useRouter();
  const seccionMes = useRef<HTMLElement>(null);

  const [bloques, setBloques] = useState<Bloque[]>(() => [{ clave: "inicial", destinoId: destinos[0].id, contenido: { tipo: "vacio" } }]);
  const [mes, setMes] = useState<number | null>(null);
  const [viajeros, setViajeros] = useState(2);
  const [hotel, setHotel] = useState<CategoriaHotel>("estandar");
  const [adjunto, setAdjunto] = useState<EstadoAdjunto>(null);
  const [completando, setCompletando] = useState(false);
  const [enviando, setEnviando] = useState<"A" | "mixto" | null>(null);
  const [error, setError] = useState<Problema | null>(null);
  const [recuperado, setRecuperado] = useState(false);
  const borradorListo = useRef(false);

  // El borrador se lee después de montar: el servidor no conoce el almacenamiento del navegador.
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_BORRADOR);
      const b = guardado ? (JSON.parse(guardado) as Borrador) : null;
      const valido = b && Array.isArray(b.bloques) && b.bloques.length > 0 && b.bloques.every((x) => destinos.some((d) => d.id === x.destinoId));
      if (valido) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee una sola vez, después de hidratar
        setBloques(b.bloques);
        setMes(b.mes);
        setViajeros(b.viajeros);
        setHotel(b.hotel);
        setAdjunto(b.adjunto?.estado === "listo" ? b.adjunto : null);
        setRecuperado(true);
      }
    } catch {
      // Sin almacenamiento (modo privado, bloqueado): se sigue sin borrador.
    }
    borradorListo.current = true;
  }, [destinos]);

  useEffect(() => {
    if (!borradorListo.current) return;
    try {
      const b: Borrador = { bloques, mes, viajeros, hotel, adjunto: adjunto?.estado === "listo" ? adjunto : null };
      localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(b));
    } catch {}
  }, [bloques, mes, viajeros, hotel, adjunto]);

  // Next conserva la página oculta al ir al itinerario: al volver, sin la pantalla de carga.
  useEffect(() => () => setEnviando(null), []);

  const exp = (id: string | null) => (id ? experiencias.find((e) => e.id === id) : undefined);
  const ocupa = (b: Bloque) => (b.contenido.tipo === "experiencia" ? (exp(b.contenido.id)?.dias ?? 1) : 1);
  const total = bloques.reduce((n, b) => n + ocupa(b), 0);
  const vacio = (b: Bloque) =>
    b.contenido.tipo === "vacio" || (b.contenido.tipo === "experiencia" && !b.contenido.id) || (b.contenido.tipo === "texto" && !b.contenido.texto.trim());

  const actualizar = (clave: string, b: Bloque) => {
    setError(null);
    setBloques((lista) => lista.map((x) => (x.clave === clave ? b : x)));
  };
  const quitar = (clave: string) => setBloques((lista) => lista.filter((x) => x.clave !== clave));
  const agregar = () => {
    const ultimo = bloques.at(-1)!;
    const e = ultimo.contenido.tipo === "experiencia" ? exp(ultimo.contenido.id) : undefined;
    // El día nuevo empieza donde terminó el anterior (p. ej. de Machu Picchu se vuelve a Cusco).
    setBloques([...bloques, { clave: nuevaClave(), destinoId: e?.terminaEnId ?? ultimo.destinoId, contenido: { tipo: "vacio" } }]);
  };

  function validar(): boolean {
    const problema: Problema | null = adjunto?.estado === "subiendo" ? "subiendo" : mes === null ? "mes" : null;
    setError(problema);
    if (problema === "mes") seccionMes.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    return problema === null;
  }

  function verItinerario() {
    if (!validar()) return;
    if (bloques.every(vacio) && adjunto?.estado !== "listo") return setError("vacio");
    enviar();
  }

  function abrirCompletar() {
    if (validar()) setCompletando(true);
  }

  async function enviar(completar?: PedidoCompletar) {
    setCompletando(false);
    setEnviando(completar ? "mixto" : "A");
    const carga: Carga = {
      dias: bloques.map((b) => {
        const c = b.contenido;
        return {
          destinoId: b.destinoId,
          ...(c.tipo === "experiencia" && c.id && { experienciaId: c.id }),
          ...(c.tipo === "texto" && c.texto.trim() && { textoLibre: c.texto.trim() }),
          ...(c.tipo === "libre" && { libre: true }),
        };
      }),
      mes: mes!,
      viajeros,
      hotel,
      ...(completar && { completar }),
      ...(adjunto?.estado === "listo" && { adjunto: adjunto.adjunto }),
    };
    const resultado = await conEsperaMinima(cargarViaje(carga));
    if (resultado.ok) {
      try {
        localStorage.removeItem(CLAVE_BORRADOR);
      } catch {}
      router.push(`/itinerario/${resultado.slug}`);
      return;
    }
    setEnviando(null);
    if (resultado.error === "adjunto") setAdjunto(null);
    setError(resultado.error === "adjunto" ? "adjunto" : "guardado");
  }

  const visitados = new Set(bloques.map((b) => b.destinoId));
  // Día en que empieza cada bloque.
  const inicios = bloques.map((_, i) => 1 + bloques.slice(0, i).reduce((n, b) => n + ocupa(b), 0));

  return (
    <div className="wrap max-w-[860px] pb-32">
      <div className="grid gap-3 pt-[clamp(28px,5vw,56px)] pb-8">
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1 className="text-[clamp(1.9rem,4.4vw,2.8rem)]">{t("titulo")}</h1>
        <p className="lead">{t("lead")}</p>
        {recuperado && <p className="w-fit rounded-sm bg-sand px-3.5 py-2.5 text-[0.88rem] text-ink-2">{t("borrador")}</p>}
      </div>

      <ol className="grid gap-4">
        {bloques.map((b, i) => {
          return (
            <DiaEditor
              key={b.clave}
              bloque={b}
              desde={inicios[i]}
              hasta={inicios[i] + ocupa(b) - 1}
              cupo={MAX_DIAS_VIAJE - (total - ocupa(b))}
              destinos={destinos}
              experiencias={experiencias}
              onCambio={(nuevo) => actualizar(b.clave, nuevo)}
              onQuitar={bloques.length > 1 ? () => quitar(b.clave) : null}
            />
          );
        })}
      </ol>

      <div className="mt-4 grid justify-items-start gap-2">
        <Boton variante="contorno" onClick={agregar} disabled={total >= MAX_DIAS_VIAJE}>
          <Icono nombre="plus" /> {t("agregar")}
        </Boton>
        {total >= MAX_DIAS_VIAJE && <small className="text-[0.86rem] text-muted">{t("maximo")}</small>}
      </div>

      <section ref={seccionMes} className="mt-12 grid gap-7 border-t border-line pt-10" aria-labelledby="datos-titulo">
        <div className="grid gap-2">
          <h2 id="datos-titulo" className="text-[clamp(1.5rem,3vw,2rem)]">
            {t("datos.titulo")}
          </h2>
          <p className="text-muted">{t("datos.lead")}</p>
        </div>
        <fieldset className="grid gap-3">
          <legend className="mb-1 font-head text-[1.1rem] font-medium">{t("datos.mes")}</legend>
          <p className="-mt-2 text-[0.92rem] text-muted">{t("datos.mesAyuda")}</p>
          <SelectorMes
            mes={mes}
            onCambio={(m) => {
              setMes(m);
              setError(null);
            }}
          />
          {error === "mes" && <p className="text-[0.9rem] font-medium text-error">{t("errores.mes")}</p>}
        </fieldset>
        <div className="grid gap-3">
          <h3 className="text-[1.1rem]">{t("datos.viajeros")}</h3>
          <Contador valor={viajeros} min={1} max={20} onCambio={setViajeros} menos={ta("viajeros.menos")} mas={ta("viajeros.mas")}>
            <b className="block font-head text-[2.4rem] leading-none font-light">{viajeros}</b>
            <span className="text-[0.9rem] text-muted">{ta("viajeros.viajeros")}</span>
          </Contador>
        </div>
        <fieldset className="grid gap-3">
          <legend className="mb-1 font-head text-[1.1rem] font-medium">{t("datos.hotel")}</legend>
          <SelectorHotel hotel={hotel} onCambio={setHotel} />
        </fieldset>
      </section>

      <section className="mt-12 grid gap-4 border-t border-line pt-10" aria-labelledby="adjunto-titulo">
        <div className="grid gap-2">
          <span className="w-fit rounded-full bg-sand px-2.5 py-1 text-[0.75rem] font-semibold text-ink-2">{t("adjunto.opcional")}</span>
          <h2 id="adjunto-titulo" className="text-[clamp(1.5rem,3vw,2rem)]">
            {t("adjunto.titulo")}
          </h2>
          <p className="text-muted">{t("adjunto.lead")}</p>
        </div>
        <Adjuntar
          estado={adjunto}
          onCambio={(e) => {
            setAdjunto(e);
            setError(null);
          }}
        />
      </section>

      {/* Acciones fijas abajo */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[rgba(246,241,234,.95)] pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {error && (
          <p role="alert" className="wrap max-w-[860px] pt-3 text-[0.9rem] font-medium text-error">
            {t(`errores.${error}`)}
          </p>
        )}
        <div className="wrap flex max-w-[860px] items-center gap-3 py-3">
          <span className="text-[0.92rem] font-semibold text-ink-2 max-[640px]:hidden">{t("resumen", { n: total })}</span>
          <div className="ml-auto grid grid-cols-2 gap-2.5 max-[640px]:w-full">
            <Boton variante="contorno" onClick={abrirCompletar} disabled={enviando !== null} className="max-[640px]:px-3 max-[640px]:text-[0.9rem]">
              {t("acciones.completar")}
            </Boton>
            <Boton onClick={verItinerario} disabled={enviando !== null} className="max-[640px]:px-3 max-[640px]:text-[0.9rem]">
              {t("acciones.ver")}
            </Boton>
          </div>
        </div>
      </div>

      <DialogoCompletar
        abierto={completando}
        cargados={total}
        hayVacios={bloques.some(vacio)}
        destinos={ofrecidos.filter((d) => !visitados.has(d.id))}
        onCerrar={() => setCompletando(false)}
        onCompletar={enviar}
      />

      {enviando === "A" && <Armando titulo={t("armando.titulo")} pasos={t.raw("armando.pasos") as string[]} />}
      {enviando === "mixto" && <Armando titulo={ta("armando.titulo")} pasos={ta.raw("armando.pasos") as string[]} />}
    </div>
  );
}

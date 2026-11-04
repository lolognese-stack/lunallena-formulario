"use client";

import { getCountries, getCountryCallingCode, isValidPhoneNumber, type CountryCode } from "libphonenumber-js/min";
import { useMemo } from "react";

// Primero los países de donde más escriben; después el resto en orden alfabético.
const FRECUENTES: CountryCode[] = ["PE", "AR", "CL", "CO", "MX", "US", "ES", "BR", "EC", "UY", "BO", "FR", "CA", "GB", "DE", "IT"];

export interface ValorTelefono {
  pais: CountryCode;
  numero: string;
}

/** Número en E.164 a partir del país y lo que escribió. Si escribió con "+", se respeta. */
export function aE164({ pais, numero }: ValorTelefono): string {
  const limpio = numero.replace(/[^\d+]/g, "");
  if (!limpio) return "";
  if (limpio.startsWith("+")) return limpio;
  return `+${getCountryCallingCode(pais)}${limpio.replace(/^0+/, "")}`;
}

export function telefonoValido(v: ValorTelefono): boolean {
  const e164 = aE164(v);
  return !!e164 && isValidPhoneNumber(e164);
}

/** País sugerido según el idioma del navegador (es-AR → AR). Si no hay región, Perú. */
export function paisInicial(): CountryCode {
  if (typeof navigator === "undefined") return "PE";
  for (const idioma of navigator.languages ?? [navigator.language]) {
    const region = idioma.split("-")[1]?.toUpperCase();
    if (region && (getCountries() as string[]).includes(region)) return region as CountryCode;
  }
  return "PE";
}

export function Telefono({
  valor,
  onCambio,
  etiqueta,
  etiquetaPais,
  error,
}: {
  valor: ValorTelefono;
  onCambio: (v: ValorTelefono) => void;
  etiqueta: string;
  etiquetaPais: string;
  error?: string | null;
}) {
  const paises = useMemo(() => {
    const nombres = new Intl.DisplayNames(["es"], { type: "region" });
    const todos = getCountries().map((c) => ({ c, nombre: nombres.of(c) ?? c, codigo: getCountryCallingCode(c) }));
    const frecuentes = FRECUENTES.map((c) => todos.find((x) => x.c === c)!).filter(Boolean);
    const resto = todos.filter((x) => !FRECUENTES.includes(x.c)).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return { frecuentes, resto };
  }, []);

  return (
    <div className="grid gap-1.5">
      <label htmlFor="q-whatsapp" className="text-[0.92rem] font-semibold">
        {etiqueta}
      </label>
      <div className="grid grid-cols-[minmax(0,8.5rem)_1fr] gap-2">
        <select
          aria-label={etiquetaPais}
          value={valor.pais}
          onChange={(e) => onCambio({ ...valor, pais: e.target.value as CountryCode })}
          className="h-13 min-w-0 rounded-sm border-[1.5px] border-line bg-card px-2 text-[0.95rem] outline-none focus:border-gold"
        >
          <optgroup label="—">
            {paises.frecuentes.map((p) => (
              <option key={p.c} value={p.c}>
                {p.nombre} +{p.codigo}
              </option>
            ))}
          </optgroup>
          <optgroup label="—">
            {paises.resto.map((p) => (
              <option key={p.c} value={p.c}>
                {p.nombre} +{p.codigo}
              </option>
            ))}
          </optgroup>
        </select>
        <input
          id="q-whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={valor.numero}
          onChange={(e) => onCambio({ ...valor, numero: e.target.value })}
          aria-invalid={!!error}
          aria-describedby={error ? "q-whatsapp-error" : undefined}
          className="h-13 min-w-0 rounded-sm border-[1.5px] border-line bg-card px-4 text-[1rem] outline-none focus:border-gold aria-invalid:border-error"
        />
      </div>
      {error && (
        <span id="q-whatsapp-error" className="text-[0.85rem] text-error">
          {error}
        </span>
      )}
    </div>
  );
}

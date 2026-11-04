// Opciones del quiz v2. Sin lógica: lo importa también el navegador (el scoring no).

export const VIAJEROS = [1, 2, 3, 4, 5, 6] as const; // 6 = "6+"
export const DIAS = ["4-5", "6-7", "8-10", "11+"] as const;
export const HOTELES = ["economico", "estandar", "superior"] as const;
export const PRESUPUESTOS = ["lt500", "500-1000", "1000-1500", "1500-2500", "gt2500", "nose"] as const;
export const ETAPAS = ["listo", "comparando", "mirando"] as const;
export const VUELOS = ["comprados", "cotizando", "no"] as const;
export const FLEXIBILIDAD = ["fijas", "aproximadas", "flexible"] as const;

export type Viajeros = (typeof VIAJEROS)[number];
export type RangoDias = (typeof DIAS)[number];
export type Hotel = (typeof HOTELES)[number];
export type Presupuesto = (typeof PRESUPUESTOS)[number];
export type Etapa = (typeof ETAPAS)[number];
export type Vuelos = (typeof VUELOS)[number];
export type Flexibilidad = (typeof FLEXIBILIDAD)[number];

export const PUENTE = {
  precio: ["dentro", "alto", "lejos"],
  reserva: ["este_mes", "1a3_meses", "nose"],
  decide: ["solo_yo", "falta_alguien"],
} as const;
export type IdPuente = keyof typeof PUENTE;
export type RespuestasPuente = { [K in IdPuente]?: (typeof PUENTE)[K][number] };

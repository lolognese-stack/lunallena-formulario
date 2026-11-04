// Validación de lo que manda el navegador a /api/score-parcial y /api/lead.
// Nunca se acepta un score del navegador: si viene, se ignora (zod descarta claves extra).

import { z } from "zod";
import { DIAS, ETAPAS, FLEXIBILIDAD, HOTELES, PRESUPUESTOS, PUENTE, VIAJEROS, VUELOS } from "@/lib/scoring/v2";
import { IDS_TARJETAS } from "./experiencias";

const texto = (max: number) => z.string().trim().max(max);

export const esquemaRespuestas = z.object({
  viajeros: z.number().int().refine((n) => (VIAJEROS as readonly number[]).includes(n)),
  experiencias: z.array(z.enum(IDS_TARJETAS as [string, ...string[]])).min(1).max(IDS_TARJETAS.length).transform((x) => [...new Set(x)]),
  mes: z.number().int().min(1).max(12),
  flexibilidad: z.enum(FLEXIBILIDAD),
  dias: z.enum(DIAS),
  hotel: z.enum(HOTELES),
  presupuesto: z.enum(PRESUPUESTOS),
  etapa: z.enum(ETAPAS),
  vuelos: z.enum(VUELOS),
});

export const esquemaPuente = z
  .object({
    precio: z.enum(PUENTE.precio).optional(),
    reserva: z.enum(PUENTE.reserva).optional(),
    decide: z.enum(PUENTE.decide).optional(),
  })
  .default({});

export const esquemaScoreParcial = z.object({ respuestas: esquemaRespuestas });

export const esquemaLead = z.object({
  respuestas: esquemaRespuestas,
  puente: esquemaPuente,
  contacto: z.object({
    nombre: texto(120).min(2),
    email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
    whatsapp: texto(40).default(""),
  }),
  comentario: texto(1000).default(""),
  utm: z
    .object({ source: texto(160).optional(), medium: texto(160).optional(), campaign: texto(160).optional(), content: texto(160).optional() })
    .default({}),
  referrer: texto(500).optional(),
  /** Honeypot: campo oculto. Si viene con algo, es un bot. */
  empresa: z.string().max(200).optional(),
});

export type EntradaLead = z.infer<typeof esquemaLead>;

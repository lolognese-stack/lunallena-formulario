import { z } from "zod";
import { OCASIONES, PRESUPUESTOS, VUELOS } from "@/lib/score";

/** Respuestas del flujo B tal como llegan del navegador. Se validan siempre en el servidor. */
export const esquemaRespuestas = z.object({
  dias: z.number().int().min(3).max(15),
  mes: z.number().int().min(1).max(12),
  destinos: z.array(z.string().min(1).max(64)).min(1).max(8),
  estilo: z.enum(["clasico", "aventura", "mistico", "relax"]),
  viajeros: z.number().int().min(1).max(20),
  hotel: z.enum(["economico", "estandar", "superior"]),
});

export type RespuestasEntrada = z.infer<typeof esquemaRespuestas>;

/** Lo que agrega el quiz del armador: filtro, lo que nos contó y el contacto. */
export const esquemaPerfil = z.object({
  presupuesto: z.enum(PRESUPUESTOS),
  ocasion: z.enum(OCASIONES),
  vuelos: z.enum(VUELOS),
  cuenta: z.string().max(2000).default(""),
  contacto: z.object({
    nombre: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
    ig: z.string().trim().max(60).default(""),
  }),
  utm_source: z.string().max(120).optional(),
  utm_campaign: z.string().max(160).optional(),
  referer: z.string().max(300).optional(),
  duracion_segundos: z.number().int().min(0).max(100000).optional(),
  apellido_2: z.string().max(200).optional(), // honeypot
});

export const esquemaArmador = esquemaRespuestas.extend({ perfil: esquemaPerfil });
export type PerfilEntrada = z.infer<typeof esquemaPerfil>;

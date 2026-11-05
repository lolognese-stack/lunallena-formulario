import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { urlPublica, WHATSAPP_NUMERO } from "@/lib/contacto";
import { mailerResend } from "@/lib/correo/resend";
import { crmSink } from "@/lib/crm/sink";
import { obtenerCatalogo } from "@/lib/datos/catalogo";
import { guardarItinerario } from "@/lib/datos/itinerarios";
import { referenciasDe } from "@/lib/datos/referencias";
import { clienteServicio } from "@/lib/datos/supabase";
import { RepoMemoria, RepoSupabase, type RepoLeads } from "./repo";
import type { ConfigLeads, DepsLeads } from "./servicio";

// Dependencias reales de los endpoints. Variables de entorno: ver .env.example.

const memoria = ((globalThis as { __repoLeadsMemoria?: RepoMemoria }).__repoLeadsMemoria ??= new RepoMemoria());

export function repoLeads(): RepoLeads {
  const db = clienteServicio();
  if (db) return new RepoSupabase(db as unknown as SupabaseClient);
  // Sin base: solo en desarrollo (o probando el build con ITINERARIOS_EN_MEMORIA=1).
  if (process.env.NODE_ENV === "production" && process.env.ITINERARIOS_EN_MEMORIA !== "1") {
    throw new Error("Falta SUPABASE_SECRET_KEY: no se pueden guardar leads.");
  }
  return memoria;
}

export function configLeads(): ConfigLeads {
  return {
    numeroWhatsapp: process.env.NUMERO_AGENCIA_WHATSAPP || WHATSAPP_NUMERO,
    sal: process.env.HASH_SALT || "",
    solesPorUsd: Number(process.env.SOLES_POR_USD) || 3.75,
    limiteIp: 5,
    ventanaIpMin: 10,
    ventanaIdempotenciaMin: 10,
  };
}

export async function depsLeads(): Promise<DepsLeads> {
  const { catalogo, fuente } = await obtenerCatalogo();
  return {
    repo: repoLeads(),
    crm: crmSink(),
    ahora: () => new Date(),
    catalogo,
    config: configLeads(),
    guardarItinerario: async (motor, itinerario) => {
      const { slug } = await guardarItinerario({ origen: "B", respuestas: motor, fuenteCatalogo: fuente, itinerario, referencias: referenciasDe(itinerario, catalogo) });
      return slug;
    },
  };
}

/** IP del cliente. En Vercel, el primer valor de x-forwarded-for. */
export function ipDe(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
}

/** Dependencias de la cola de mails y del score vivo. */
export function depsCola() {
  return {
    repo: repoLeads(),
    crm: crmSink(),
    mailer: mailerResend(),
    ahora: () => new Date(),
    config: { urlPublica: urlPublica(), alertasEmail: process.env.ALERTAS_EMAIL || null },
  };
}

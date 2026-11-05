import { NextResponse } from "next/server";
import { secretoCoincide } from "@/lib/correo/firma";
import { procesarCola } from "@/lib/leads/cola";
import { depsCola } from "@/lib/leads/deps";

// GET /armador/api/cron/mails: procesa la cola de mails (hasta 50 por corrida).
// Protegido con CRON_SECRET: cabecera "Authorization: Bearer <CRON_SECRET>".
// Lo dispara el Worker de Cloudflare de armador/cron-worker cada 5 minutos.
export const maxDuration = 60;

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  if (!secretoCoincide(token, process.env.CRON_SECRET)) return NextResponse.json({ error: "no_autorizado" }, { status: 401 });
  try {
    const resumen = await procesarCola(depsCola());
    return NextResponse.json({ ok: true, ...resumen }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("Cron mails:", e);
    return NextResponse.json({ error: "cola" }, { status: 500 });
  }
}

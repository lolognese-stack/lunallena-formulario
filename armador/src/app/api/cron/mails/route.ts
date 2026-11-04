import { NextResponse } from "next/server";
import { secretoCoincide } from "@/lib/correo/firma";
import { repoLeads } from "@/lib/leads/deps";

// GET /armador/api/cron/mails: procesa la cola de mails. Protegido con CRON_SECRET
// (cabecera "Authorization: Bearer <CRON_SECRET>"). Lo dispara un Worker de Cloudflare cada 5 min.
// Fase 2: solo informa cuántos mails están vencidos. El envío llega en la fase 4.
export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  if (!secretoCoincide(token, process.env.CRON_SECRET)) return NextResponse.json({ error: "no_autorizado" }, { status: 401 });
  const vencidos = await repoLeads().mailsVencidos(new Date(), 100);
  return NextResponse.json({ ok: true, vencidos: vencidos.length, enviados: 0 }, { headers: { "cache-control": "no-store" } });
}

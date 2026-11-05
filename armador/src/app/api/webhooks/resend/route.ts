import { NextResponse } from "next/server";
import { firmaSvixValida } from "@/lib/correo/firma";
import { crmSink } from "@/lib/crm/sink";
import { repoLeads } from "@/lib/leads/deps";
import { registrarEventoResend, type EventoResend } from "@/lib/leads/webhook";

// POST /armador/api/webhooks/resend: clics en los mails (email.clicked) → evento + score vivo (+5 por mail).
// En Resend → Webhooks: URL https://lunallenatravel.vercel.app/armador/api/webhooks/resend/
// y el "signing secret" en RESEND_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const cuerpo = await req.text();
  const h = { id: req.headers.get("svix-id"), timestamp: req.headers.get("svix-timestamp"), firma: req.headers.get("svix-signature") };
  if (!firmaSvixValida(cuerpo, h, process.env.RESEND_WEBHOOK_SECRET)) return NextResponse.json({ error: "firma" }, { status: 401 });
  let ev: EventoResend;
  try {
    ev = JSON.parse(cuerpo);
  } catch {
    return NextResponse.json({ error: "json" }, { status: 400 });
  }
  try {
    const r = await registrarEventoResend(ev, h.id, { repo: repoLeads(), crm: crmSink(), ahora: () => new Date() });
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    console.error("Webhook Resend:", e);
    return NextResponse.json({ error: "guardado" }, { status: 500 }); // Resend reintenta
  }
}

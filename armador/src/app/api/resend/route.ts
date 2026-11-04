import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { avisarCrm } from "@/lib/crm";

// Webhook de Resend: aperturas, clics y rebotes de los mails del armador → CRM.
// En Resend: Webhooks → URL https://lunallenatravel.vercel.app/armador/api/resend/,
// eventos email.opened, email.clicked y email.bounced; el "signing secret" va en
// RESEND_WEBHOOK_SECRET (firma estilo Svix).

const EVENTOS: Record<string, string> = { "email.opened": "mail_abierto", "email.clicked": "mail_clic", "email.bounced": "mail_rebotado" };

function firmaValida(cuerpo: string, h: Headers) {
  const secreto = process.env.RESEND_WEBHOOK_SECRET;
  if (!secreto) return false;
  const id = h.get("svix-id"), ts = h.get("svix-timestamp"), firmas = h.get("svix-signature");
  if (!id || !ts || !firmas) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const clave = Buffer.from(secreto.replace(/^whsec_/, ""), "base64");
  const esperada = createHmac("sha256", clave).update(`${id}.${ts}.${cuerpo}`).digest();
  return firmas.split(" ").some((f) => {
    const b = Buffer.from(f.split(",")[1] ?? "", "base64");
    return b.length === esperada.length && timingSafeEqual(b, esperada);
  });
}

export async function POST(req: Request) {
  const cuerpo = await req.text();
  if (!firmaValida(cuerpo, req.headers)) return NextResponse.json({ error: "firma" }, { status: 401 });
  const ev = JSON.parse(cuerpo) as { type?: string; data?: { tags?: Record<string, string> | { name: string; value: string }[] } };
  const evento = EVENTOS[ev.type ?? ""];
  const tags = ev.data?.tags;
  const slug = Array.isArray(tags) ? tags.find((x) => x.name === "slug")?.value : tags?.slug;
  if (evento && slug) await avisarCrm({ tipo: "evento", ref: slug, evento });
  return NextResponse.json({ ok: true });
}

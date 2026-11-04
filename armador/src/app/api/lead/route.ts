import { NextResponse } from "next/server";
import { depsLeads, ipDe } from "@/lib/leads/deps";
import { crearLead } from "@/lib/leads/servicio";

// POST /armador/api/lead → { leadId, grupo, whatsappUrl? }
// Recalcula itinerario y score de cero, guarda el lead y encola los mails.
export async function POST(req: Request) {
  const entrada = await req.json().catch(() => null);
  try {
    const r = await crearLead(entrada, { ip: ipDe(req) }, await depsLeads());
    return NextResponse.json(r.body, { status: r.status, headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("POST /api/lead:", e);
    return NextResponse.json({ error: "guardado" }, { status: 500 });
  }
}

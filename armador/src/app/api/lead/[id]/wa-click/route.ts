import { NextResponse } from "next/server";
import { crmSink } from "@/lib/crm/sink";
import { repoLeads } from "@/lib/leads/deps";
import { registrarClicWa } from "@/lib/leads/servicio";

// POST /armador/api/lead/:id/wa-click → marca "wa_abierto". El front lo llama antes de abrir WhatsApp.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const r = await registrarClicWa(id, { repo: repoLeads(), crm: crmSink() });
    return NextResponse.json(r.body, { status: r.status, headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("POST /api/lead/:id/wa-click:", e);
    return NextResponse.json({ error: "guardado" }, { status: 500 });
  }
}

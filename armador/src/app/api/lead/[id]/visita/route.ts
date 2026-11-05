import { NextResponse } from "next/server";
import { crmSink } from "@/lib/crm/sink";
import { repoLeads } from "@/lib/leads/deps";
import { registrarVisita } from "@/lib/leads/vivo";

// POST /armador/api/lead/:id/visita: el lead volvió al armador desde un link del mail (?l=<id>).
// Score vivo: +10, una vez por día.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const r = await registrarVisita(id, { repo: repoLeads(), crm: crmSink(), ahora: () => new Date() });
    // No se devuelve el puntaje: solo si se registró.
    return NextResponse.json({ ok: r.motivo !== "lead_no_existe" }, { status: r.motivo === "lead_no_existe" ? 404 : 200, headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("POST /api/lead/:id/visita:", e);
    return NextResponse.json({ error: "guardado" }, { status: 500 });
  }
}

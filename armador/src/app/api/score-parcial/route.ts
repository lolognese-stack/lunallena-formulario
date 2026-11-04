import { NextResponse } from "next/server";
import { obtenerCatalogo } from "@/lib/datos/catalogo";
import { configLeads } from "@/lib/leads/deps";
import { calcularParcial } from "@/lib/leads/servicio";

// POST /armador/api/score-parcial → { zonaGris, preguntas }
// Al terminar el paso 7. El servidor decide si hay preguntas puente y cuáles.
export async function POST(req: Request) {
  const entrada = await req.json().catch(() => null);
  const { catalogo } = await obtenerCatalogo();
  const r = calcularParcial(entrada, { catalogo, config: configLeads(), ahora: () => new Date() });
  return NextResponse.json(r.body, { status: r.status, headers: { "cache-control": "no-store" } });
}

import { configLeads, repoLeads } from "@/lib/leads/deps";
import { urlWhatsapp } from "@/lib/leads/servicio";
import { BASE } from "@/lib/contacto";

// GET /armador/api/lead/:id/wa: botón de WhatsApp de los mails.
// Devuelve una página mínima que primero hace POST a wa-click y después abre WhatsApp.
// No marca nada en el GET: los antivirus de correo abren los links sin ejecutar JavaScript,
// y eso no debe contar como "wa_abierto".
const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const config = configLeads();
  const lead = await repoLeads().obtenerLead(id).catch(() => null);
  const destino = lead ? urlWhatsapp(lead, config.numeroWhatsapp) : `https://wa.me/${config.numeroWhatsapp.replace(/\D/g, "")}`;
  const aviso = lead ? json(`${BASE}/api/lead/${encodeURIComponent(lead.id)}/wa-click/`) : "null";
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Abriendo WhatsApp…</title>
<style>body{margin:0;display:grid;place-items:center;min-height:100vh;background:#F5EEDD;color:#1E1B18;font:400 16px/1.5 Manrope,Arial,sans-serif;text-align:center;padding:24px}a{display:inline-block;margin-top:16px;padding:14px 22px;background:#25D366;color:#0B3D20;font-weight:600;text-decoration:none;border-radius:2px}</style></head>
<body><main><p>Abriendo WhatsApp…</p><a href="${esc(destino)}">Abrir WhatsApp</a></main>
<script>(function(){var u=${aviso},d=${json(destino)};function ir(){location.replace(d)}if(!u)return ir();try{fetch(u,{method:"POST",keepalive:true}).finally(ir)}catch(e){ir()}setTimeout(ir,1500)})()</script></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

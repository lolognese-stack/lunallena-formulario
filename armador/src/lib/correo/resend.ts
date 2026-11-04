import "server-only";

// Envío por Resend (API HTTP, sin SDK). Sin RESEND_API_KEY el armador queda en
// modo prueba: no manda nada y muestra el itinerario y los mails en pantalla.

const API = "https://api.resend.com";

export const correoActivo = () => Boolean(process.env.RESEND_API_KEY);
export const remitente = () => process.env.RESEND_FROM || "Luna Llena Travel <viajes@lunallenatravel.com>";

export interface Envio {
  para: string;
  asunto: string;
  html: string;
  texto: string;
  enviarEn?: Date; // programado (Resend acepta hasta 30 días)
  etiquetas?: Record<string, string>;
}

export async function enviar(e: Envio): Promise<string> {
  const res = await fetch(`${API}/emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: remitente(),
      to: [e.para],
      reply_to: process.env.RESEND_REPLY_TO || undefined,
      subject: e.asunto,
      html: e.html,
      text: e.texto,
      scheduled_at: e.enviarEn?.toISOString(),
      tags: Object.entries(e.etiquetas ?? {}).map(([name, value]) => ({ name, value })),
    }),
  });
  const j = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok || !j.id) throw new Error(`Resend ${res.status}: ${j.message ?? "sin id"}`);
  return j.id;
}

/** Cancela un mail programado que todavía no salió. Si ya salió, Resend responde error y se ignora. */
export async function cancelar(id: string) {
  await fetch(`${API}/emails/${id}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  }).catch(() => {});
}

// Envío por Resend (API HTTP, sin SDK). La cola y los tiempos los maneja nuestro backend
// (mail_cola + /api/cron/mails): acá solo se manda en el momento.

const API = "https://api.resend.com";

export interface Envio {
  para: string;
  asunto: string;
  html: string;
  texto: string;
  /** Etiquetas de Resend: vuelven en los webhooks (lead_id, mail_id). Solo letras, números, _ y -. */
  etiquetas?: Record<string, string>;
}

export interface Mailer {
  enviar(e: Envio): Promise<{ id: string }>;
}

/** Mailer real. Null si falta RESEND_API_KEY o MAIL_FROM: la cola no manda nada. */
export function mailerResend(env: Record<string, string | undefined> = process.env): Mailer | null {
  const clave = env.RESEND_API_KEY;
  const desde = env.MAIL_FROM || env.RESEND_FROM;
  if (!clave || !desde) return null;
  return {
    async enviar(e) {
      const res = await fetch(`${API}/emails`, {
        method: "POST",
        headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: desde,
          to: [e.para],
          reply_to: env.RESEND_REPLY_TO || undefined,
          subject: e.asunto,
          html: e.html,
          text: e.texto,
          tags: Object.entries(e.etiquetas ?? {}).map(([name, value]) => ({ name, value })),
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!res.ok || !j.id) throw new Error(`Resend ${res.status}: ${j.message ?? "sin id"}`);
      return { id: j.id };
    },
  };
}

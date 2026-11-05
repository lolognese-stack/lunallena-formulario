// Dispara la cola de mails del armador cada 5 minutos (Vercel Hobby solo permite un cron por día).
// Secreto: `npx wrangler secret put CRON_SECRET` (el mismo valor que en Vercel).
// URL: variable CRON_URL en wrangler.toml.

export default {
  async scheduled(_evento, env, ctx) {
    ctx.waitUntil(disparar(env));
  },
  // GET manual para probar: responde lo mismo que el cron (requiere el secreto en la cabecera).
  async fetch(req, env) {
    if (req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) return new Response("no autorizado", { status: 401 });
    return disparar(env);
  },
};

async function disparar(env) {
  const res = await fetch(env.CRON_URL, { headers: { authorization: `Bearer ${env.CRON_SECRET}` } });
  const cuerpo = await res.text();
  if (!res.ok) console.error(`Cola de mails ${res.status}: ${cuerpo}`);
  else console.log(`Cola de mails: ${cuerpo}`);
  return new Response(cuerpo, { status: res.status, headers: { "content-type": "application/json" } });
}

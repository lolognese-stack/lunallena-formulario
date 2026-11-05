# Cron de la cola de mails

Worker de Cloudflare que llama a `GET /armador/api/cron/mails/` cada 5 minutos con
`Authorization: Bearer <CRON_SECRET>`.

```bash
cd armador/cron-worker
npx wrangler deploy
npx wrangler secret put CRON_SECRET   # el mismo valor que CRON_SECRET en Vercel
```

Ver ejecuciones: Cloudflare → Workers → lunallena-armador-cron → Logs.

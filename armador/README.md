# Armador de viaje (quiz) · lunallenatravel.vercel.app/armador

Next.js 16 + Supabase. Recuperado del deploy de Vercel `lunallena-planificador`
(el repo original se perdió) y adaptado a quiz con filtro por mail.

## Recorrido

1. `/armador/armar/`: días y mes → destinos → estilo → viajeros y hotel →
   presupuesto, ocasión y vuelos → "cuéntanos" (opcional) → nombre y mail.
2. El servidor (`src/app/armar/acciones.ts`) arma el itinerario con el motor,
   calcula el score (`src/lib/score.ts`), lo guarda en Supabase, crea el lead en
   el CRM (`/api/armador`) y programa 5 mails en Resend (`src/lib/correo/`).
3. Mail 1 a los 10 minutos con el itinerario. Caliente y tibio reciben el botón
   de WhatsApp desde el mail 1; frío, desde el mail 5 (día 8).
4. El botón de WhatsApp pasa por `/armador/wa/[slug]/`: anota el clic en el CRM,
   cancela los mails que faltan y redirige a wa.me.

## Variables (Vercel, proyecto lunallena-planificador)

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | catálogo e itinerarios |
| `URL_PUBLICA` | `https://lunallenatravel.vercel.app/armador` (links de mails y WhatsApp) |
| `RESEND_API_KEY` | sin ella el armador queda en **modo prueba**: no manda mails y muestra itinerario y mails en pantalla |
| `RESEND_FROM` | remitente, ej. `Luna Llena Travel <viajes@lunallenatravel.com>` (dominio verificado en Resend) |
| `RESEND_REPLY_TO` | opcional |
| `RESEND_WEBHOOK_SECRET` | webhook de Resend → `/armador/api/resend/` (aperturas, clics, rebotes) |
| `CRM_URL` | opcional, por defecto `https://crm-plantilla.pages.dev` |

## Publicar

La web estática (raíz de este repo) reenvía `/armador/*` a
`lunallena-planificador.vercel.app/armador/*` (`vercel.json`). Este directorio
está fuera del sitio estático (`.vercelignore`) y se publica aparte:

    cd armador && npx vercel deploy --prod

## Armador v2 (quiz funnel nuevo)

- Scoring: `src/lib/scoring/v2.ts` (puro, con tests). `npm test` corre todos los tests.
- Lógica de endpoints: `src/lib/leads/servicio.ts`; rutas en `src/app/api/` (con el basePath quedan en `/armador/api/...`):
  `score-parcial`, `lead`, `lead/[id]/wa-click`, `webhooks/resend`, `cron/mails`.
- Base de datos: correr una vez `supabase/migraciones/001_leads_v2.sql` en Supabase → SQL Editor
  (solo agrega las tablas `lead`, `evento`, `mail_cola` e `intento_ip`, con RLS y sin políticas).
- Tiempos de la secuencia de mails: `src/lib/correo/secuencia.ts`.
- CRM: interfaz `CrmSink` en `src/lib/crm/sink.ts` (hoy no hace nada).
- Variables de entorno: `.env.example`.

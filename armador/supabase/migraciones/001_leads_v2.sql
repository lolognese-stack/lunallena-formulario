-- Armador v2: leads del quiz, eventos, cola de mails y límite por IP.
-- Solo agrega tablas nuevas: no toca destinations, experiences, itineraries ni las demás.
-- Se corre una vez en Supabase → SQL Editor. Se puede volver a correr sin romper nada.
--
-- RLS activado y sin políticas: solo la clave secreta del servidor (SUPABASE_SECRET_KEY)
-- puede leer o escribir. La clave publicable no ve nada de esto.

create extension if not exists pgcrypto;

-- ---------- lead ----------
create table if not exists public.lead (
  id                uuid primary key default gen_random_uuid(),
  codigo            text not null unique,                 -- "LL-7K3QH": va en el mensaje de WhatsApp
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now(),
  nombre            text not null,
  email             text not null,
  whatsapp          text,                                  -- E.164 si es válido; si no, null
  whatsapp_crudo    text,                                  -- lo que escribió la persona
  respuestas        jsonb not null,                        -- respuestas crudas del quiz
  score_total       smallint not null check (score_total between 0 and 100),
  score_desglose    jsonb not null,
  reglas_aplicadas  text[] not null default '{}',
  score_version     text not null,
  grupo             text not null check (grupo in ('calificado', 'no_calificado')),
  vio_puente        boolean not null default false,
  preguntas_puente  text[] not null default '{}',
  respuestas_puente jsonb not null default '{}',
  precio_desde      numeric(10, 2),                        -- USD por persona del itinerario armado
  itinerario_slug   text,                                  -- itineraries.share_slug
  utm               jsonb not null default '{}',           -- source, medium, campaign, content
  referrer          text,
  estado            text not null default 'nuevo'
                    check (estado in ('nuevo', 'wa_abierto', 'contactado', 'cotizado', 'ganado', 'perdido')),
  huella            text not null,                         -- sha256(email + respuestas): idempotencia de 10 min
  ip_hash           text
);

create index if not exists lead_huella_idx on public.lead (huella, creado_en desc);
create index if not exists lead_email_idx on public.lead (lower(email));
create index if not exists lead_estado_idx on public.lead (estado, creado_en desc);

-- ---------- evento ----------
create table if not exists public.evento (
  id        bigint generated always as identity primary key,
  lead_id   uuid not null references public.lead (id) on delete cascade,
  tipo      text not null
            check (tipo in ('envio', 'wa_click', 'mail_enviado', 'mail_clic', 'visita', 'cambio_score', 'alerta', 'cambio_estado')),
  payload   jsonb not null default '{}',
  creado_en timestamptz not null default now()
);

create index if not exists evento_lead_idx on public.evento (lead_id, creado_en desc);
create index if not exists evento_tipo_idx on public.evento (lead_id, tipo, creado_en desc);

-- ---------- mail_cola ----------
create table if not exists public.mail_cola (
  id         bigint generated always as identity primary key,
  lead_id    uuid not null references public.lead (id) on delete cascade,
  plantilla  text not null,                                -- ver src/lib/correo/secuencia.ts
  enviar_en  timestamptz not null,
  estado     text not null default 'pendiente' check (estado in ('pendiente', 'enviado', 'cancelado')),
  intentos   smallint not null default 0,
  enviado_en timestamptz,
  resend_id  text,
  error      text,
  creado_en  timestamptz not null default now()
);

create index if not exists mail_cola_pendientes_idx on public.mail_cola (enviar_en) where estado = 'pendiente';
create index if not exists mail_cola_lead_idx on public.mail_cola (lead_id);

-- ---------- intento_ip (rate limit de /api/lead) ----------
create table if not exists public.intento_ip (
  id        bigint generated always as identity primary key,
  ip_hash   text not null,
  creado_en timestamptz not null default now()
);

create index if not exists intento_ip_idx on public.intento_ip (ip_hash, creado_en desc);

-- ---------- RLS ----------
alter table public.lead       enable row level security;
alter table public.evento     enable row level security;
alter table public.mail_cola  enable row level security;
alter table public.intento_ip enable row level security;

-- actualizado_en automático
create or replace function public.tocar_actualizado_en() returns trigger language plpgsql as $$
begin
  new.actualizado_en := now();
  return new;
end $$;

drop trigger if exists lead_actualizado_en on public.lead;
create trigger lead_actualizado_en before update on public.lead
  for each row execute function public.tocar_actualizado_en();

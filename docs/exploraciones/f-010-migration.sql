-- =====================================================================
-- F-010 · Unificar posts y projects en la tabla posts (PROPUESTA, NO EJECUTADA)
--
-- AVISO: ESTE SCRIPT ES DESTRUCTIVO.
-- Borra SIN copia las tablas posts, projects, tags, posts_tags y analytics,
-- las vistas analytics_* y la función track_view, con todos sus datos.
-- El humano decidió empezar de cero (no se migran datos). Revísalo entero,
-- haz un backup si dudas y ejecútalo a mano en el SQL Editor de Supabase.
--
-- Requisito: F-011 mergeada y desplegada, y sus dos SQL ya ejecutados
-- (f-011-auth-role.sql: rol y schema better_auth; f-011-rls.sql: user_id fuera
-- de images, RLS de images, revoke de analytics_* a anon,
-- bucket público de 1 MB sin escritura para anon). Este script no repite nada
-- de eso; solo crea lo que la tabla posts nueva necesita.
-- Cuándo: justo al desplegar F-010. Entre ejecutarlo y que el deploy termine,
-- el código anterior (que aún lee projects y excerpt) falla: es la ventana de
-- deploy de una migración destructiva, no un hueco de escritura de anon.
-- Decisiones cerradas: posts.type es texto libre (sin check constraint); RLS
-- opción B con better-auth (anon solo lee posts publicados).
-- Los ficheros que ya haya en las carpetas posts/ y projects/ del bucket
-- quedan huérfanos (el humano los borra a mano). Se pierden las visitas a páginas que no son un
-- post (page_path, resource_type 'page'): aceptado por el humano.
-- Todos los objetos van en el schema public (los clientes no pasan db.schema).
-- =====================================================================

begin;

-- 1. Borrado del modelo anterior (orden: dependientes primero, sin cascade
--    para que una dependencia desconocida aborte la transacción).
drop view if exists public.analytics_top_projects;
drop view if exists public.analytics_top_posts;
drop view if exists public.analytics_daily;
drop view if exists public.analytics_summary;
drop function if exists public.track_view; -- falla si hay varias sobrecargas: bórralas con su firma
drop table if exists public.analytics;
drop table if exists public.analytics_events;
drop table if exists public.posts_tags;
drop table if exists public.tags;
drop table if exists public.projects;
drop table if exists public.posts;

-- 2. Tabla posts unificada
create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  -- Texto libre a propósito: el dueño crea las categorías que quiera.
  type        text not null default 'blog',
  title       text not null,
  content     text not null default '',
  description text,
  slug        text unique,
  cover_image text,
  tags        text[] not null default '{}',
  github_url  text,
  website_url text,
  published   boolean not null default false,
  featured    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- La app nunca envía updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

-- 3. Eventos de vista: uno por entrada a cualquier post, sin resource_type.
create table public.analytics_events (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  visitor_id text,
  referrer   text,
  user_agent text,
  viewed_at  timestamptz not null default now()
);

create index analytics_events_post_id_idx on public.analytics_events (post_id);
create index analytics_events_viewed_at_idx on public.analytics_events (viewed_at);

-- Única vía de escritura para el portfolio público (F-006 decide si se llama
-- directo con la publishable key o desde un route handler). Solo cuenta posts publicados.
-- Riesgo asumido: cualquiera con la key puede inflar vistas.
create or replace function public.track_view(
  p_post_id    uuid,
  p_visitor_id text default null,
  p_referrer   text default null,
  p_user_agent text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.analytics_events (post_id, visitor_id, referrer, user_agent)
  select p.id, left(p_visitor_id, 64), left(p_referrer, 2048), left(p_user_agent, 512)
  from public.posts p
  where p.id = p_post_id and p.published;
$$;

revoke all on function public.track_view(uuid, text, text, text) from public;
grant execute on function public.track_view(uuid, text, text, text) to anon, authenticated;

-- 4. Vistas de analytics (el prefijo analytics_ es configurable en la app con
--    NEXT_PUBLIC_SUPABASE_ANALYTICS_PREFIX; si lo cambias, renombra aquí).
--    Se crean SIN security_invoker a propósito: corren con permisos del dueño y
--    exponen solo agregados, sin abrir analytics_events (visitor_id, user_agent)
--    a anon. El advisor de Supabase avisará de "security definer view".
create view public.analytics_summary as
select
  count(*)::int                   as total_views,
  count(distinct visitor_id)::int as unique_visitors
from public.analytics_events;

create view public.analytics_daily as
select
  (viewed_at at time zone 'utc')::date as day,
  count(*)::int                        as views,
  count(distinct visitor_id)::int      as unique_visitors
from public.analytics_events
group by 1;

create view public.analytics_top_posts as
select
  p.id,
  p.title,
  p.slug,
  count(*)::int                     as views,
  count(distinct e.visitor_id)::int as unique_visitors,
  max(e.viewed_at)                  as last_viewed_at
from public.analytics_events e
join public.posts p on p.id = e.post_id
group by p.id;

-- Solo las lee el servidor (decisión F-011). Los privilegios por defecto de
-- Supabase conceden select a anon/authenticated en objetos nuevos de public, así
-- que hay que revocarlo otra vez al recrear las vistas.
revoke select on public.analytics_summary, public.analytics_daily, public.analytics_top_posts
  from anon, authenticated;
grant select on public.analytics_summary, public.analytics_daily, public.analytics_top_posts
  to service_role;

-- 5. RLS de las tablas nuevas (las de images y el bucket ya las dejó F-011).
--    El dashboard usa la secret key (se salta RLS); anon/authenticated solo
--    leen posts publicados.
alter table public.posts enable row level security;
-- Sin políticas: nadie lee ni escribe eventos directamente (solo track_view y las vistas).
alter table public.analytics_events enable row level security;

create policy posts_public_read on public.posts
  for select to anon, authenticated using (published);

commit;

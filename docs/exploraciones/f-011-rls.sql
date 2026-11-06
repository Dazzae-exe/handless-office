-- =====================================================================
-- F-011 · RLS, vistas de analytics y bucket sobre el esquema ACTUAL
--        (posts + projects). PROPUESTA, NO EJECUTADA.
--
-- Paso 2 de F-011. Ejecutar DESPUÉS de desplegar el código de F-011 (lecturas
-- y escrituras del dashboard en el servidor con SUPABASE_SECRET_KEY, que se
-- salta RLS). Si se ejecuta antes, el código que hoy está en main (escribe
-- desde el navegador con la publishable key) deja de poder escribir.
--
-- No es destructivo con los datos, salvo la columna user_id de posts, projects
-- e images (decisión del humano: se quita).
-- Si una vista o función depende de user_id, el drop column falla y la
-- transacción entera se aborta: revisa la dependencia y vuelve a ejecutar.
-- =====================================================================

begin;

-- 1. Quitar TODAS las políticas existentes de posts, projects e images
--    (sus nombres no se conocen y pueden depender de user_id/auth.uid()).
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('posts', 'projects', 'images')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- 2. Sin user_id: un solo dueño, escrituras solo en el servidor.
alter table public.posts    drop column if exists user_id;
alter table public.projects drop column if exists user_id;
alter table public.images   drop column if exists user_id;

-- 3. RLS: anon/authenticated (publishable key, portfolio público) solo leen lo
--    publicado. images sin políticas: solo el servidor.
alter table public.posts    enable row level security;
alter table public.projects enable row level security;
alter table public.images   enable row level security;

create policy posts_public_read on public.posts
  for select to anon, authenticated using (published);
create policy projects_public_read on public.projects
  for select to anon, authenticated using (published);

-- 4. Las vistas analytics_* solo las lee el servidor (secret key = service_role).
--    track_view sigue siendo ejecutable por anon (no se toca).
revoke select on public.analytics_summary, public.analytics_daily,
  public.analytics_top_posts, public.analytics_top_projects
  from anon, authenticated;
grant select on public.analytics_summary, public.analytics_daily,
  public.analytics_top_posts, public.analytics_top_projects
  to service_role;

-- 5. Storage: bucket público (la URL pública sirve el fichero sin política),
--    límite = MAX_IMAGE_SIZE (1 MB) y sin políticas de escritura: solo sube el
--    servidor.
update storage.buckets set public = true, file_size_limit = 1048576
where id = 'tiptap_content';

commit;

-- 6. A mano: borra las políticas del bucket que den escritura a anon/authenticated.
--    No se automatiza porque storage.objects puede tener políticas de otros buckets.
--   select policyname, cmd, roles, qual, with_check from pg_policies
--   where schemaname = 'storage' and tablename = 'objects';
--   drop policy "<nombre>" on storage.objects;

-- Comprobaciones con la publishable key (deben fallar o devolver vacío):
--   insert en /rest/v1/posts y /rest/v1/projects -> 401/403
--   select en /rest/v1/analytics_summary          -> permission denied
--   select en /rest/v1/posts?published=eq.false   -> []

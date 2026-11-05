-- =====================================================================
-- F-011 · Rol y schema de better-auth (PROPUESTA, NO EJECUTADA)
--
-- Paso 1 de F-011. Aditivo: no toca public, ni tablas, ni RLS existentes, así
-- que se puede ejecutar antes de desplegar el código de F-011.
--
-- AVISO: la contraseña NO va en el repo. Sustituye CAMBIA_ESTA_CONTRASEÑA a mano
-- en el SQL Editor de Supabase (p. ej. con `openssl rand -base64 32`) y no
-- guardes el archivo con la contraseña real.
--
-- Después:
--   DATABASE_URL = cadena del pooler en modo transaction (puerto 6543) con este
--   rol como usuario (en Supavisor: better_auth_app.<project_ref>) y esta
--   contraseña (los símbolos de la contraseña van con percent-encoding en la URL).
--   Para `npx auth@latest migrate` usa la misma cadena en modo session (5432):
--   crea user, session, account y verification dentro de better_auth.
-- =====================================================================

begin;

create role better_auth_app with login password 'CAMBIA_ESTA_CONTRASEÑA';

-- postgres no es superusuario en Supabase: para crear un schema cuyo dueño es
-- otro rol tiene que ser miembro de ese rol.
grant better_auth_app to postgres;

-- Dueño del schema: puede crear y alterar las tablas que better-auth necesite.
create schema if not exists better_auth authorization better_auth_app;

-- Sin acceso a public: no se le concede nada sobre sus tablas, vistas ni
-- secuencias. (El USAGE que PUBLIC tiene por defecto sobre el schema public no
-- da acceso a ninguna tabla: las tablas de Supabase se conceden a anon,
-- authenticated y service_role, no a PUBLIC).
revoke all on all tables in schema public from better_auth_app;
revoke all on all sequences in schema public from better_auth_app;
revoke create on schema public from better_auth_app;

-- anon/authenticated no ven el schema (tampoco se expone en la Data API).
revoke all on schema better_auth from anon, authenticated;

alter role better_auth_app set search_path = better_auth;

commit;

-- Comprobación (debe devolver false):
--   select has_table_privilege('better_auth_app', 'public.posts', 'select');

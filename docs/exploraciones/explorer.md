2026-11-05 - Feature: F-002 - Contexto de la exploración: ¿cuál es la forma más pequeña y con tipado estricto (sin any) de pasar a supabase.from() un nombre de tabla, vista o bucket leído de variables de entorno sin perder el tipado de columnas de Database?
Hallazgos:
- postgrest-js (PostgrestClient.ts:152-181) restringe `from()` a `keyof Schema['Tables' | 'Views']`. Los tipos de fila salen solo del literal. En runtime solo comprueba que el string no esté vacío y lo añade a la URL, así que un cast a literal solo afecta a los tipos.
- `supabase.storage.from(bucket)` acepta cualquier string.
- Nombres fijos en servidor: app/(dashboard)/page.tsx (count('posts'|'projects')), posts/page.tsx, posts/[id]/page.tsx, projects/page.tsx (x2), projects/[id]/page.tsx y lib/supabase/analytics.ts (4 vistas analytics_*).
- Nombres fijos en cliente: lib/supabase/posts.ts, projects.ts y storage.ts (bucket tiptap_content y tabla images).
- La tabla tags y posts_tags no se consultan en ninguna parte. No hay llamadas .rpc().
- lib/supabase.ts no lo importa nadie (código muerto con ANON_KEY).
Decisiones tomadas:
- Opción (a): un módulo lib/supabase/tables.ts con TABLES, VIEWS y el bucket, cada nombre leído con `process.env.NEXT_PUBLIC_X || 'default'` y con cast a su clave literal de Database.
- Se usa `||` para que una variable vacía vuelva al valor por defecto.
- Las variables se referencian de forma literal para que Next las incruste en el bundle del cliente. Cambiarlas exige reconstruir.
- No se añade variable para tags, porque no se usa.
- Riesgo asumido: si la tabla propia tiene columnas distintas, los tipos no lo detectan. Se documenta en el README que el esquema debe coincidir.

2026-11-05 - Feature: F-002 (revisión) - Contexto de la exploración: investigación de cómo funciona la configuración de tablas y revisión estricta de calidad del diff.
Hallazgos:
- Las variables NEXT_PUBLIC_* se incrustan al compilar; cambiarlas exige pnpm build (o reiniciar pnpm dev).
- Los clientes no pasan db.schema: todas las tablas deben estar en el schema public.
- `||` no recorta espacios: un valor con espacios produce un nombre de tabla inválido.
- El insert de images con await bloqueaba la inserción de la imagen en el editor y descartaba el error en silencio.
- EDITOR_IMAGE_BUCKET en tables.ts mezclaba configuración de Storage con nombres de tablas; su único consumidor es storage.ts.
- Fuera del diff: conversión de errores inconsistente entre posts.ts y projects.ts/analytics.ts, y UUID_RE duplicado en las páginas [id].
Decisiones tomadas:
- Se mantienen los casts al literal de Database: es la mentira de tipos mínima y está concentrada en un archivo.
- Se mantiene la sanitización de q en lib/list-params.ts; no se añade tipo marcado (branded) porque no hay riesgo real.
- La deuda fuera del diff pasa a F-009.

2026-11-05 - Feature: F-010 - Contexto de la exploración: con las decisiones del humano (nombre posts, description/slug/featured/github_url/website_url, tags, columna type, empezar de cero, analytics sin resource_type), ¿cuál es el tipo Post unificado, cómo se modela type y cómo queda el esquema de analytics?
Hallazgos:
- types/post.ts y types/project.ts comparten id, user_id, title, content, cover_image, published, created_at y updated_at. Solo Post tiene excerpt, slug y featured. Solo Project tiene description, github_url, demo_url y tags: string[].
- user_id está tipado como string, pero desde F-004 la app no lo envía y no hay auth, así que en la base de datos es null.
- types/database.ts declara las tablas posts, projects, tags, posts_tags, images y analytics (los eventos; no se llama analytics_events). También declara cuatro vistas y la función track_view(p_page_path, p_resource_type, p_resource_id, ...). La app no llama a track_view ni escribe eventos; solo lee las vistas.
- tags y posts_tags no se consultan en ninguna parte. El filtro por tag de projects usa query.contains('tags', [tag]) sobre text[].
- lib/supabase/analytics.ts lee summary, daily, top_posts y top_projects. analytics/page.tsx muestra post_views y project_views y suma daily por día entre resource_type. El README documenta page_views y resource_type 'page'.
- EditorContentType ('posts' | 'projects') solo sirve para elegir la carpeta del bucket en storage.ts y en TiptapEditor.
- updated_at nunca se envía desde la app (PostUpdate lo omite), así que hace falta un trigger.
Decisiones tomadas:
- Tipo Post unificado (types/post.ts): `id: string; user_id: string | null; type: PostType; title: string; content: string; description: string | null; slug: string | null; cover_image: string | null; tags: string[]; github_url: string | null; website_url: string | null; published: boolean; featured: boolean; created_at: string; updated_at: string`. PostInsert, PostUpdate y PostFormData se mantienen como hoy (Omit de id, user_id, created_at y updated_at).
- type: columna text not null default 'blog' con check constraint `type in ('blog', 'project')`. En TS es `export type PostType = 'blog' | 'project'` en types/post.ts. La lista para el select y el validador va en utils/validators/post.ts (`POST_TYPES: readonly PostType[]`). Se descarta el enum de Postgres porque no permite quitar valores y hay que regenerar el tipo. Se descarta text libre porque pierde la unión en TS y el filtro. Con check, añadir un valor es drop/add constraint más una línea en TS. Los valores 'blog' y 'project' son provisionales.
- user_id: uuid nullable con default auth.uid() (null mientras no haya auth). En TS pasa a `string | null`.
- slug: unique y nullable (Postgres admite varios null). tags: text[] not null default '{}'. Sin índice GIN mientras el volumen sea de un portfolio.
- Analytics: tabla analytics_events (id, post_id uuid not null FK a posts on delete cascade, visitor_id, referrer, user_agent, viewed_at). Desaparecen page_path, resource_type y resource_id. Se escribe solo con track_view(p_post_id, p_visitor_id, p_referrer, p_user_agent), una función security definer que solo inserta si el post está publicado. RLS está activo sin políticas.
- Vistas: analytics_summary (total_views, unique_visitors), analytics_daily (day, views, unique_visitors: una fila por día) y analytics_top_posts (id, title, slug, views, unique_visitors, last_viewed_at). Se crean sin security_invoker para exponer solo agregados a anon.
- TS de analytics: se borran AnalyticsResourceType y AnalyticsTopProject. AnalyticsSummary queda con total_views y unique_visitors, AnalyticsDaily sin resource_type y AnalyticsData sin topProjects. En database.ts, analytics pasa a analytics_events y track_view a la nueva firma.
- RLS de posts: se deja como dos opciones comentadas (A: anon con CRUD total, que es el estado actual del código; B: lectura pública de lo publicado y escritura del dueño autenticado). No se cierra porque depende de F-004.
- SQL propuesto, sin ejecutar: docs/exploraciones/f-010-migration.sql.

2026-11-05 - Feature: F-011 - Contexto de la exploración: el humano eligió la opción B de RLS de f-010-migration.sql (anon lee lo publicado, solo el dueño escribe) pero con login de better-auth en vez de Supabase Auth. Con better-auth auth.uid() es null: ¿cómo se protegen las escrituras, qué pasa con user_id, cómo queda la sección 5 de RLS, cómo se integra en Next.js 16 y qué método de login mínimo usar?
Hallazgos:
- F-004 no deja ningún motivo escrito para quitar la auth: ni el commit aeb229f ("remove authentication components...") ni 36019c2, decisions.md o memory.md lo explican. Lo único que se registra es que user_id y RLS quedan pendientes. Además, el proxy.ts raíz que llamaba a updateSession ya se había borrado en 37b86db, así que antes de F-004 la redirección a /login no se ejecutaba.
- La auth anterior tenía registro público (/signup y /auth/confirm con signUp de Supabase). En un proyecto de un solo dueño, esto dejaba que cualquiera creara una cuenta y escribiera sus propios posts e imágenes en tu Supabase. Esto no debe volver.
- Supabase third-party auth (docs supabase.com/docs/guides/auth/third-party, consultado 2026-11) solo admite Clerk, Firebase, Auth0, Cognito, WorkOS y "Custom OIDC". Para Custom OIDC exige una URL de discovery `<issuer>/.well-known/openid-configuration` en HTTPS, JWT firmado con clave asimétrica y `kid` (HS256 no vale) y el claim `role`. better-auth no aparece en la lista.
- better-auth 1.7 (plugin jwt) expone /jwks, firma con EdDSA/Ed25519 por defecto (configurable a ES256/RS256) y permite definePayload/getSubject, pero el plugin jwt no sirve el documento openid-configuration. Haría falta además el plugin de proveedor OIDC o una ruta propia, HTTPS también en local y un token de 15 min que el cliente de Supabase tendría que renovar (opción accessToken). La alternativa de firmar con el JWT secret legacy (HS256) depende de algo que Supabase está retirando en favor de las signing keys asimétricas.
- Supabase: la secret key (sb_secret_...) y la service key se saltan RLS en tablas y en Storage (docs storage/security/access-control). En un bucket público la lectura por URL no necesita política; subir, borrar y mover sí la necesitan.
- Supabase: Supavisor en modo transaction (6543) no admite prepared statements ni estado de sesión (SET, opciones de arranque). El modo session (5432) y la conexión directa sí (docs database/connecting-to-postgres y troubleshooting/disabling-prepared-statements). node-postgres y Kysely no usan prepared statements con nombre, así que funcionan en 6543.
- better-auth 1.7 (docs adapters/postgresql): acepta `new Pool()` de pg o `{ dialect: new PostgresDialect({ pool }), type: 'postgres', schemaName }`. Con schemaName todas las consultas llevan el schema delante ("better_auth"."user") y `npx auth@latest migrate` crea el schema si hace falta. También admite search_path (`?options=-c search_path=...` o `options` del Pool), pero eso depende del estado de sesión, que no es fiable en el pooler 6543.
- better-auth 1.7: la CLI nueva es `npx auth@latest generate|migrate`; @better-auth/cli queda deprecada (blog 1.5). migrate solo funciona con el adaptador Kysely integrado, que es el que usan Pool y PostgresDialect. Las tablas base son user, session, account y verification.
- better-auth 1.7: `advanced.database.generateId: 'uuid'` genera ids UUID, nativos en Postgres desde la 1.4. Por defecto los ids son text.
- better-auth 1.7 Next.js: `toNextJsHandler(auth)` en app/api/auth/[...all]/route.ts. El plugin `nextCookies()` (va el último del array) escribe las cookies en Server Actions. En Next 16 el middleware pasa a proxy.ts, que corre en Node. La documentación recomienda en el proxy solo `getSessionCookie(request)` (comprobación optimista, "THIS IS NOT SECURE") y validar de verdad con `auth.api.getSession({ headers: await headers() })` en cada página y Server Action.
- better-auth 1.7: `emailAndPassword.disableSignUp` y `disableSignUp` por proveedor social. Para limitar quién se registra, la documentación propone `databaseHooks.user.create.before` lanzando APIError.
- Next.js 16.2 (guía data-security): cada Server Action es un punto de entrada público y tiene que volver a comprobar la sesión. Un layout no protege las páginas, porque en la navegación suave no se vuelve a ejecutar. El límite del cuerpo de una Server Action es 1 MB por defecto (`experimental.serverActions.bodySizeLimit`), y MAX_IMAGE_SIZE ya es 1 MB, así que una subida multipart lo supera.
- Código actual: posts.ts, projects.ts y storage.ts escriben desde el navegador con la publishable key. Las páginas del dashboard y analytics.ts leen con server.ts, también con la publishable key (rol anon). Con la opción B, anon ya no vería los borradores, así que las lecturas del dashboard también tienen que pasar al servidor con la secret key. uploadEditorImage se llama desde PostForm, ProjectForm y TiptapEditor.
- analytics_events, track_view y las vistas analytics_* no dependen de user_id ni de auth.uid(), así que no cambian.
Decisiones tomadas:
- Opción (a). better-auth usa el adaptador Postgres sobre la misma BD de Supabase, en un schema propio. Todas las lecturas y escrituras del dashboard van al servidor: Server Components y Server Actions comprueban la sesión de better-auth y usan un cliente de Supabase con SUPABASE_SECRET_KEY. RLS solo deja a anon leer lo publicado. Es la opción más simple: no hay JWT que firmar ni renovar, no depende de una función de Supabase que no soporta better-auth ni del JWT secret legacy, y en local funciona sin HTTPS. Montarlo en un fork solo pide dos variables más y un `migrate`. Seguridad: la secret key no lleva NEXT_PUBLIC y vive en un módulo con `import 'server-only'`. Además, Supabase rechaza las secret keys usadas desde un navegador. Se descarta (b) por complejidad y fragilidad, y no hay una (c) mejor.
- Punto único de control: lib/supabase/admin.ts exporta `createAdminClient()`, que antes de crear el cliente con la secret key hace `await requireSession()` (de lib/auth.ts, con React cache, que llama a auth.api.getSession y redirige a /login si no hay sesión). Así ningún uso de la secret key se salta la sesión, aunque una página o action olvide comprobarla.
- user_id: se elimina de posts (y de images). Con un solo dueño y las escrituras en el servidor, ninguna política lo usa y auth.uid() siempre es null. Por eso no hace falta generateId: 'uuid' ni FK. Si se quisiera conservar como autoría, sería `user_id uuid references better_auth."user"(id) on delete set null` sin default, rellenado en el servidor con session.user.id, y entonces sí haría falta generateId: 'uuid' (queda como pregunta abierta). En f-010-migration.sql, en la sección 2, se borra la línea `user_id uuid default auth.uid(),` y su comentario. En TS, Post e Image pierden user_id.
- Sección 5 de f-010-migration.sql propuesta, en sustitución de la actual:
```sql
-- 5. RLS (F-011: login con better-auth). El dashboard lee y escribe desde el
--    servidor con la secret key, que se salta RLS. Para anon/authenticated
--    (publishable key, portfolio público) solo hay lectura de lo publicado.
alter table public.posts enable row level security;
alter table public.analytics_events enable row level security; -- sin políticas: solo track_view y las vistas
alter table public.images enable row level security;           -- sin políticas: solo el servidor

create policy posts_public_read on public.posts
  for select to anon, authenticated using (published);

-- images: user_id ya no se usa (auth.uid() es null con better-auth).
alter table public.images drop column if exists user_id;

-- Storage: bucket público (la URL pública sirve el fichero sin política) y sin
-- políticas de escritura; solo sube y borra el servidor. Límite = MAX_IMAGE_SIZE.
update storage.buckets set public = true, file_size_limit = 1048576
where id = 'tiptap_content';
-- Borra a mano las políticas antiguas del bucket que den escritura a anon/authenticated:
--   select policyname, cmd, roles from pg_policies
--   where schemaname = 'storage' and tablename = 'objects';
--   drop policy "<nombre>" on storage.objects;
```
- Next 16: app/api/auth/[...all]/route.ts con `export const { GET, POST } = toNextJsHandler(auth)`. lib/auth.ts (servidor, 'server-only'): betterAuth con `database: { dialect: new PostgresDialect({ pool: new Pool({ connectionString: process.env.DATABASE_URL, max: 1 }) }), type: 'postgres', schemaName: 'better_auth' }`, emailAndPassword y `plugins: [nextCookies()]` (el último), más requireSession. lib/auth-client.ts: `createAuthClient()` de better-auth/react para signIn y signOut. proxy.ts en la raíz: solo `getSessionCookie` y redirige a /login, con un matcher que excluye /login, /api/auth, _next y estáticos. La validación real va en createAdminClient/requireSession.
- Escrituras: lib/supabase/posts.ts pasa a ser un archivo 'use server' que usa createAdminClient(), así que hooks/usePosts.ts sigue importando las mismas funciones. Imágenes: validateImageFile, ACCEPTED_IMAGE_TYPES y MAX_IMAGE_SIZE se mueven a utils/validators/image.ts (funciones puras, y un archivo 'use server' solo puede exportar funciones async). uploadEditorImage pasa a ser una Server Action que recibe el File, valida otra vez, sube e inserta en images con la secret key. Se añade `experimental.serverActions.bodySizeLimit: '2mb'` en next.config.ts. Si el límite de imagen crece, la alternativa es createSignedUploadUrl desde el servidor y uploadToSignedUrl desde el navegador.
- Lecturas: las páginas del dashboard y analytics.ts usan createAdminClient(). lib/supabase/client.ts y server.ts se quedan sin uso y se borran, igual que la dependencia @supabase/ssr. NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ya no la usa esta app; solo la usa el portfolio público.
- Tablas y schema: las tablas de better-auth (user, session, account, verification) van en el schema `better_auth`. No se usa `auth`, que es de Supabase, ni `public`, que expone la Data API. Ese schema no está expuesto por PostgREST y anon/authenticated no tienen permisos sobre él. Se crea con `npx auth@latest migrate` usando schemaName (no search_path, porque no es fiable en el pooler 6543).
- DATABASE_URL: la cadena del pooler de Supabase en modo transaction (6543), con un Pool de `max: 1` por instancia serverless. Si en local se usa el modo session (5432), también funciona.
- Variables de entorno nuevas (todas solo de servidor): BETTER_AUTH_SECRET (`openssl rand -base64 32`), BETTER_AUTH_URL (http://localhost:3000 o la URL de producción), DATABASE_URL, SUPABASE_SECRET_KEY (sb_secret_...) y ADMIN_EMAIL. Se mantienen NEXT_PUBLIC_SUPABASE_URL y los nombres de tablas/bucket.
- Login mínimo: email y contraseña, sin verificación por correo ni página de registro. `databaseHooks.user.create.before` lanza APIError si `user.email !== process.env.ADMIN_EMAIL`. Así el endpoint de registro solo sirve para crear al dueño una vez, y después falla por email duplicado. El primer usuario se crea con un POST a `/api/auth/sign-up/email` (curl con cabecera Origin igual a BETTER_AUTH_URL), documentado en el README. Se descarta GitHub OAuth como mínimo porque cada fork tendría que crear una OAuth App con su callback.
- No se reintroduce de F-004: el registro público (/signup y /auth/confirm), user_id enviado desde el cliente y el proxy como única protección.
Preguntas abiertas:
- ¿Conservar user_id como autoría (uuid con FK a better_auth."user" y generateId: 'uuid') o eliminarlo, que es lo recomendado?
- ¿Cuál fue el motivo real de quitar la auth en F-004? Si fue "no quiero gestionar usuarios de Supabase", la opción (a) lo respeta.
- ¿Hace falta recuperar la contraseña? (sendResetPassword exige un proveedor de correo). Si no, se puede resetear con SQL o borrando el usuario y volviendo a registrarlo.
- ¿Se revoca a anon el select de las vistas analytics_* ahora que el dashboard lee con la secret key? Hoy el portfolio público puede leer los agregados. F-010 lo decidió así y se mantiene salvo que se diga otra cosa.
- El rate limit de better-auth guarda en memoria por instancia en serverless. ¿Basta para un único login o se activa `rateLimit.storage: 'database'`?
- ¿DATABASE_URL con el rol postgres, o con un rol propio limitado al schema better_auth? Es más seguro, pero añade un paso de instalación.
- Orden: cuando se ejecute el SQL de F-010 con esta sección 5, las escrituras actuales desde el navegador fallarán hasta que lleguen las Server Actions de F-011. ¿Se hace en una sola rama o se acepta ese hueco?

2026-11-05 - Feature: F-010 (cierre de preguntas abiertas) - Contexto de la exploración: aplicar las respuestas del humano sobre type, RLS, visitas perdidas, filtro ?type e imágenes huérfanas.
Hallazgos:
- Con type libre, el check constraint, PostType y POST_TYPES sobran; el único valor útil para sugerir son los type ya guardados.
- La opción B de RLS con better-auth no puede usar auth.uid() (ver la entrada F-011 anterior): la escritura del dueño se garantiza en el servidor, no en RLS.
- Ejecutar el SQL con la nueva sección 5 deja sin escritura al código actual (escribe desde el navegador con la publishable key).
Decisiones tomadas:
- posts.type: text not null default 'blog', sin check constraint. En TS, type: string. PostForm usa un input de texto con <datalist> de los type ya usados (select en servidor). validatePost solo exige que no esté vacío. Esto sustituye la decisión anterior de lista cerrada.
- posts sin user_id; images pierde user_id. Sección 5 del SQL: anon/authenticated solo leen posts publicados; images y analytics_events con RLS sin políticas; bucket público, 1 MB y sin políticas de escritura.
- Se aceptan perder las visitas a páginas que no son un post.
- /posts gana el filtro ?type (query.eq) además de ?tag; type entra en ListParams.
- Las imágenes huérfanas de posts/ y projects/ del bucket las borra el humano a mano (tarea (Humano) en F-010).
- Orden: F-010 y F-011 en la misma rama; el SQL se ejecuta al empezar F-010 y no se despliega hasta que F-011 mueva las escrituras al servidor.

2026-11-05 - Feature: F-011 (rate limit y rol de DATABASE_URL) - Contexto de la exploración: ¿cuál es la opción exacta de better-auth para limitar el login a 5 intentos en memoria? ¿Admite Supavisor un rol propio y qué hace falta para que postgres cree un schema cuyo dueño sea ese rol?
Hallazgos:
- better-auth 1.x (docs concepts/rate-limit y reference/options, código v1.7.15): `rateLimit: { enabled, window, max, storage, customRules }`. window va en segundos; storage es 'memory' por defecto. Solo está activo por defecto en producción, así que `enabled: true` lo activa también en desarrollo. Cada valor de customRules es `{ window, max }`, `false` o una función. Ya trae una regla de 3 peticiones cada 10 s para /sign-in*, /sign-up*, /change-password y /change-email, y customRules la sustituye. La IP sale de x-forwarded-for, salvo que se configure `advanced.ipAddress.ipAddressHeaders` o trustedProxies. Con disableIpTracking el limitador deja de funcionar. En memoria, cada instancia serverless lleva su propio contador.
- Supavisor admite roles propios con el usuario `<rol>.<project_ref>`. El puerto 6543 (transaction) no admite prepared statements, así que las migraciones van por 5432 (session) o por la conexión directa.
- postgres no es superusuario en Supabase. Para `create schema ... authorization better_auth_app` hace falta antes `grant better_auth_app to postgres` (en PG15 por ser miembro y en PG16/17 por poder hacer SET ROLE). La guía de Prisma de Supabase sigue el mismo patrón.
Decisiones tomadas:
- `rateLimit: { enabled: true, storage: 'memory', customRules: { '/sign-in/email': { window: 60, max: 5 } } }`. No se configura ipAddressHeaders: en Vercel la plataforma reescribe x-forwarded-for. Si se despliega detrás de otro proxy, hay que revisarlo.
- SQL del rol en docs/exploraciones/f-011-auth-role.sql (grant a postgres, schema con authorization, revoke en public, search_path). migrate se lanza con la cadena en modo session (5432) y la app usa 6543.
- F-011 se hace sobre el esquema actual. Su SQL de RLS va en docs/exploraciones/f-011-rls.sql y se ejecuta después del deploy. f-010-migration.sql se reduce a lo que necesitan las tablas nuevas.

2026-11-09 - Feature: F-011/F-010 - Contexto de la exploración: el humano quita better-auth - Decisiones tomadas: la exploración de F-011 del 2026-11-05 (better-auth, schema better_auth, secret key en servidor) queda DESCARTADA; F-011 tendrá una exploración nueva con Supabase Auth. Para F-010 vale la opción A de RLS descrita en la exploración de F-010 (anon con CRUD, estado actual del código).

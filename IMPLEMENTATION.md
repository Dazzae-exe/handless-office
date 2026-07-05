# Implementation Log

---

## Fase 0 — Supabase Setup  
**Fecha:** 2026-06-30

### Qué se hizo

#### Supabase — Proyecto activo
- **Proyecto:** un proyecto de Supabase dedicado (región `us-east-1`).
- **URL:** configurada vía `NEXT_PUBLIC_SUPABASE_URL` en `.env.local` (ver `.env.example`).

#### Refactorización de tablas
Las tablas `posts` y `projects` existentes fueron eliminadas y recreadas. Razón: usaban `bigint` como ID (en lugar de UUID), no tenían `user_id`, y les faltaban campos esenciales. Ambas tablas tenían **0 filas**, por lo que el drop fue seguro.

#### Schema final (PostgreSQL)

| Tabla | Descripción |
|-------|-------------|
| `posts` | Blog posts con HTML de Tiptap, slug único, cover image, featured/published |
| `projects` | Proyectos con links a GitHub/demo, tags array, cover image |
| `tags` | Tags reutilizables por usuario |
| `posts_tags` | Junction table posts ↔ tags |
| `images` | Metadata de imágenes subidas a Supabase Storage |
| `analytics` | Eventos de página vista (anon + autenticado) |

**Cambios vs esquema original del CLAUDE.md:**
- Se agregó `cover_image` a `posts` y `projects` (necesario para cards en el listado)
- `projects` mantiene `tags text[]` directamente (más simple que join para este caso de uso)
- `analytics` tabla nueva para trackear visitas a posts, proyectos y páginas
- `images` incluye `alt_text` y `file_name` adicionales
- Trigger `handle_updated_at()` automático en `posts` y `projects`

#### RLS Policies configuradas

- **posts/projects:** SELECT público si `published=true`; CRUD solo al dueño (`user_id = auth.uid()`)
- **tags:** SELECT público; INSERT/UPDATE/DELETE solo al dueño
- **posts_tags:** SELECT público; all operations solo si el post pertenece al usuario
- **images:** CRUD solo al dueño
- **analytics:** INSERT abierto (cualquier visitante); SELECT solo autenticado

#### Dependencias instaladas

```
@supabase/supabase-js@2.108.2
@tiptap/react@3.27.1
@tiptap/pm@3.27.1
@tiptap/starter-kit@3.27.1
@tiptap/extension-image@3.27.1
@tiptap/extension-link@3.27.1
@tiptap/extension-placeholder@3.27.1
@tiptap/extension-character-count@3.27.1
@tiptap/extension-code-block-lowlight@3.27.1
lowlight@3.3.0
lucide-react@0.510.0
```

> Tiptap instalado en v3.27.1 (versión objetivo del proyecto).

#### Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `.env.local` | Credenciales Supabase (gitignored) |
| `.env.example` | Template de variables para el repo |
| `lib/supabase.ts` | Cliente Supabase inicializado con tipos |
| `lib/types.ts` | Tipos TypeScript core (Post, Project, Tag, Image, Analytics, Database) |

---

## Fase 1 — Autenticación
**Fecha:** 2026-06-30

### Qué se hizo

Autenticación completa con Supabase Auth sobre Next.js 16 App Router, usando
sesiones basadas en cookies (`@supabase/ssr`) y protección de rutas vía proxy.

#### Enfoque técnico
- **`@supabase/ssr`** en lugar del cliente plano: necesario para SSR + cookies.
- **Next.js 16 usa `proxy.ts`** (antes `middleware.ts`) — confirmado en build (`ƒ Proxy (Middleware)`).
- **`getClaims()`** para proteger rutas (valida la firma del JWT). Nunca se confía en `getSession()` en el servidor.
- **Server Actions** + React 19 `useActionState`/`useFormStatus` para login/signup/logout con errores inline (sin redirigir a una página de error).
- **Email/contraseña** con confirmación por correo (route handler `/auth/confirm` → `verifyOtp`).

#### Flujo de protección (proxy)
- Sin sesión en ruta protegida → redirige a `/login?redirectedFrom=…`.
- Con sesión en `/login` o `/signup` → redirige al dashboard `/`.
- Rutas públicas: `/login`, `/signup`, `/auth/*`, `/auth-code-error`.

#### Dependencia instalada
```
@supabase/ssr
```
> Usa `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (recomendado para apps nuevas).

#### Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `lib/supabase/client.ts` | Cliente browser (`createBrowserClient`) |
| `lib/supabase/server.ts` | Cliente server (Server Components / Actions / Route Handlers) |
| `lib/supabase/proxy.ts` | `updateSession()`: refresca sesión + protección de rutas |
| `proxy.ts` | Proxy (middleware) de Next.js 16 con matcher |
| `lib/hooks/useAuth.ts` | Hook de sesión cliente (`onAuthStateChange` en vivo) |
| `lib/validators/auth.ts` | Validación de email/contraseña compartida |
| `app/(auth)/layout.tsx` | Layout de auth separado del de la app |
| `app/(auth)/actions.ts` | Server Actions: `login`, `signup`, `signout` |
| `app/(auth)/AuthForm.tsx` | Form cliente reutilizable (login/signup) |
| `app/(auth)/login/page.tsx` | Pantalla de inicio de sesión |
| `app/(auth)/signup/page.tsx` | Pantalla de registro |
| `app/(auth)/auth-code-error/page.tsx` | Error de confirmación de enlace |
| `app/auth/confirm/route.ts` | Verifica el OTP del correo e inicia sesión |
| `components/common/Button.tsx` | Botón base (primary/secondary/ghost) |
| `components/common/Input.tsx` | Input con label del sistema de diseño |

#### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/globals.css` | Tokens de diseño: tema light (blanco/gris) + dark (blackout + púrpura), radios 11px, bordes 1px, `@custom-variant dark` para toggle futuro |
| `app/layout.tsx` | Metadata real del proyecto |
| `app/page.tsx` | Dashboard placeholder protegido: muestra el correo de la sesión + logout |

#### Verificación
- `tsc --noEmit` ✅ · `eslint` ✅ · `next build` ✅
- Runtime: `/` → 307 a `/login` (protegida) · `/login`, `/signup`, `/auth-code-error` → 200 (públicas)

#### Pendiente (config en el dashboard de Supabase)
- Confirmar que en **Auth → URL Configuration** la Site URL/Redirect URLs incluyan
  `http://localhost:3000/auth/confirm` (y la URL de producción al desplegar).

---

## Fase 2 — UI Base
**Fecha:** 2026-06-30

### Qué se hizo

Shell de la aplicación estilo Notion, tema claro/oscuro con selector, y
componentes comunes, todo sobre los tokens de diseño de la Fase 1.

#### Decisiones (confirmadas con el usuario)
- **Barra lateral:** fijar + flotar al pasar el puntero (comportamiento Notion
  completo). Fijada empuja el contenido; colapsada aparece flotando desde el
  borde izquierdo y se desvanece al salir. El estado se persiste.
- **Tema:** selector de 3 estados (claro / oscuro / sistema), persistido en
  `localStorage` con script anti-flash inyectado en `<head>`.
- **Footer:** pie mínimo dentro del shell (marca + copyright).
- **Navegación:** Dashboard, Posts, Proyectos, Analíticas.

#### Enfoque técnico
- **Script anti-flash** en el `<html>` (con `suppressHydrationWarning`): fija la
  clase `light`/`dark` antes del primer paint. Se aplica siempre una clase
  concreta para que las utilidades `dark:` de Tailwind funcionen en modo sistema.
- **`useSyncExternalStore`** para el tema y el estado "fijado" de la barra: lee
  `localStorage`/`matchMedia` sin `setState` dentro de efectos (cumple la regla
  `react-hooks/set-state-in-effect`) y resuelve la hidratación de forma segura.
- **Route group `(dashboard)`** con su propio layout (paralelo a `(auth)`): el
  layout servidor lee sólo el email y lo pasa al `AppShell` cliente (mínima
  serialización RSC → cliente). Las URLs no cambian (`/`, `/posts`, …).
- **`Dialog`** sobre el elemento nativo `<dialog>`: focus-trap, Escape y
  backdrop gratis y accesibles.
- **Barra lateral** con una sola `SidebarContent` reutilizada por las tres
  variantes de posición (fija en flujo, flotante `fixed`, drawer móvil con
  backdrop). Intención de hover con retardo de cierre para evitar parpadeos.

#### Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `lib/theme/theme-script.ts` | Tipos del tema + script anti-flash minificado |
| `lib/theme/ThemeProvider.tsx` | `ThemeProvider` (sync de clase) + hook `useTheme` vía store externo |
| `components/common/ThemeToggle.tsx` | Control segmentado claro/oscuro/sistema |
| `components/common/Dialog.tsx` | Modal accesible sobre `<dialog>` nativo |
| `components/common/PageHeader.tsx` | Encabezado de página con acción opcional |
| `components/common/EmptyState.tsx` | Estado vacío reutilizable |
| `components/layout/AppShell.tsx` | Orquestador del shell (fijar/flotar/móvil) |
| `components/layout/Sidebar.tsx` | `SidebarContent`: marca + navegación + usuario/logout |
| `components/layout/Header.tsx` | Barra superior: toggle de barra lateral + tema |
| `components/layout/Footer.tsx` | Pie mínimo (Server Component) |
| `app/(dashboard)/layout.tsx` | Layout de la app protegida → monta `AppShell` |
| `app/(dashboard)/page.tsx` | Inicio con tarjetas de métricas (placeholder) |
| `app/(dashboard)/posts/page.tsx` | Listado de posts (placeholder Fase 4) |
| `app/(dashboard)/projects/page.tsx` | Listado de proyectos (placeholder Fase 5) |
| `app/(dashboard)/analytics/page.tsx` | Analíticas (placeholder Fase 6) |

#### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/layout.tsx` | Script anti-flash en `<head>`, `suppressHydrationWarning`, `ThemeProvider` envolviendo el body |
| `app/page.tsx` | Eliminado: el dashboard vive ahora en `app/(dashboard)/page.tsx` |

#### Verificación
- `eslint` ✅ · `tsc --noEmit` ✅ · `next build` ✅
- Runtime: `/`, `/posts`, `/projects`, `/analytics` → 307 a `/login` (protegidas)
  · `/login`, `/signup` → 200 (públicas)

---

## Fase 3 — Editor HTML (Tiptap)
**Fecha:** 2026-06-30

### Qué se hizo

Editor rich-text estilo Notion, reutilizable, construido sobre Tiptap v3.27.
Es el componente central que las Fases 4/5 montarán en los formularios de
posts y proyectos. Se entrega como **componente standalone** (sin ruta de
prueba, decisión del usuario).

#### Decisiones (confirmadas con el usuario)
- **Modelo de interacción: Notion completo.** Sin toolbar fija. Se apoya en:
  menú de comandos `/`, menú flotante (bubble) al seleccionar texto, y handle
  de arrastre `⠿` por bloque.
- **Preview toggle = vista de lectura.** Alterna `Editar | Vista previa`
  (solo lectura, sin controles) reutilizando el mismo editor con `setEditable`.
- **Alcance: solo componente.** El wiring a formularios llega en Fase 4/5.

#### Enfoque técnico
- **`useEditor` con `immediatelyRender: false`** (obligatorio en SSR/Next para
  evitar mismatch de hidratación).
- **`useEditorState` con selector** para el estado derivado (contadores +
  estados activos del bubble menu): v3 no re-renderiza por transacción por
  defecto, así que el selector es el patrón performante recomendado.
- **Menú `/`**: `Extension` propia sobre `@tiptap/suggestion` + `ReactRenderer`.
  Usa la API v3 `props.mount()` (posicionamiento con floating-ui integrado, sin
  tippy). Navegación por teclado vía `useImperativeHandle` (`onKeyDown`).
- **Bubble menu**: `@tiptap/react/menus` con `shouldShow` (oculto en imágenes,
  bloques de código y selección vacía).
- **Drag handle**: `@tiptap/extension-drag-handle-react`. Requiere de forma
  transitiva `@tiptap/extension-collaboration` (importa `isChangeOrigin`), que
  arrastra `yjs`/`y-protocols`; se acepta el coste (aislado a la ruta del editor
  por code-splitting). Se usa **sin** modo `nested` (no invoca colaboración).
- **Imágenes**: subida a Supabase Storage (bucket `tiptap_content`), vía menú
  `/`, botón del bubble menu, **pegar** (`handlePaste`) y **soltar**
  (`handleDrop`). Organizado en carpetas por tipo de contenido y usuario:
  `<tipo>/<uid>/<uuid>.<ext>` con `tipo ∈ {posts, projects}` (exigido por la
  RLS). El editor recibe una prop `contentType` (`'posts' | 'projects'`) que
  decide la carpeta.
- **Sincronización controlada**: `value` externo → `setContent(…, {emitUpdate:false})`
  solo si difiere del HTML actual (evita saltos de cursor y bucles).
- **Markdown**: los atajos de entrada de StarterKit (`# `, `- `, `> `,
  ``` ``` ```, `**…**`, etc.) dan la conversión Markdown→bloque en vivo.

#### Bloques soportados
Texto, H1–H3, listas (viñetas / numerada / tareas con checkbox), cita, bloque
de código con resaltado (`lowlight`/`highlight.js`), divisor, imagen, enlaces,
negrita/cursiva/subrayado/tachado/código en línea.

#### Base de datos / Storage
- Bucket `tiptap_content`: `file_size_limit` 1 MB → **5 MB**;
  `allowed_mime_types` restringido a imágenes (jpeg/png/webp/gif/svg/avif).
- **RLS por carpeta** (migraciones `tiptap_content_owner_scoped_storage_policies`
  → `tiptap_content_folder_scoped_policies`): lectura pública del bucket;
  INSERT/UPDATE/DELETE solo `authenticated`, solo dentro de `posts/` o
  `projects/` y solo en su propia subcarpeta (`<tipo>/<uid>/…`).
- **Política pública previa acotada** (`restrict_public_insert_policy_off_tiptap_content`):
  `Insert images for app` (rol `public`, cualquier bucket) se recreó limitada a
  `bucket_id = 'banners'`. Así `tiptap_content` deja de aceptar subidas anónimas
  (queda solo-autenticado) sin romper otros buckets del proyecto.

#### Fix de tipos (bug preexistente)
`lib/types.ts`: `Database` y los tipos de dominio (`Post`, `Project`, `Tag`,
`Image`, `AnalyticsEvent`) eran `interface`. Las interfaces **no** tienen index
signature implícita, así que no satisfacían `Record<string, unknown>` de
`GenericSchema` de supabase-js → todas las tablas colapsaban a `never` y
cualquier `.insert()` fallaba. Convertidos a `type` (como los tipos generados
por Supabase) y añadidas las claves `Relationships`, `Views`, `Functions`,
`Enums`, `CompositeTypes`. Esto arregla el tipado para todo el CRUD futuro.

#### Dependencias instaladas
```
@tiptap/core@3.27.1
@tiptap/suggestion@3.27.1
@tiptap/extension-drag-handle@3.27.1
@tiptap/extension-drag-handle-react@3.27.1
@tiptap/extension-node-range@3.27.1
@tiptap/extension-collaboration@3.27.1   (peer de drag-handle)
@tiptap/extension-task-list@3.27.1
@tiptap/extension-task-item@3.27.1
@tiptap/y-tiptap@^3.0.5 · yjs@^13.6.31 · y-protocols@^1.0.7  (peer de collaboration)
@floating-ui/dom@^1.7.6
```

#### Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `components/editor/TiptapEditor.tsx` | Componente principal: `useEditor`, bubble menu, drag handle, toggle edición/preview, contador, paste/drop de imágenes |
| `components/editor/SlashCommandMenu.tsx` | Popup del menú `/` (React) con navegación por teclado |
| `components/editor/extensions/slash-command.ts` | Extensión Tiptap del menú `/` (Suggestion + ReactRenderer) |
| `components/editor/editor.css` | Estilos Notion sobre los tokens de diseño (bloques, código, tareas, handle) |
| `lib/supabase/storage.ts` | `uploadEditorImage()` + validación + metadata en tabla `images` |

#### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `lib/types.ts` | `interface`→`type` en `Database` y tipos de dominio; claves de `GenericSchema` (fix de tipado supabase-js) |

#### Verificación
- `eslint` ✅ · `tsc --noEmit` ✅ · `next build` ✅
- Pendiente de verificación en runtime al montar el editor en un formulario
  (Fase 4): subida de imágenes (requiere sesión autenticada).

#### Seguridad de Storage — resuelto
- La política preexistente **`Insert images for app`** (permitía subidas
  anónimas a cualquier bucket) se acotó a `banners`. `tiptap_content` ya solo
  acepta subidas de usuarios **autenticados**, dentro de `posts/`/`projects/` y
  en su propia subcarpeta.

---

## Fase 4 — CRUD de Posts
**Fecha:** 2026-07-01

### Qué se hizo

CRUD completo de posts: listado con filtros, creación y edición estilo Notion
montando el editor Tiptap de la Fase 3, y eliminación con confirmación.

#### Decisiones (confirmadas con el usuario)
- **Arquitectura híbrida RSC + hook:** los listados y el detalle se cargan en
  Server Components (sin spinner); las mutaciones (create/update/delete) viven
  en el hook cliente `usePosts`, que llama a `router.refresh()` tras cada
  operación para revalidar los RSC.
- **Página de escritura estilo Notion:** título gigante sin borde + editor a
  ancho completo. Los metadatos (slug, excerpt, portada, destacado,
  despublicar, eliminar) viven en un diálogo «Ajustes».
- **Slug auto + editable:** se deriva del título con `slugify()` hasta que el
  usuario lo toca (estado derivado en render, sin efectos). La cover image se
  sube al bucket `tiptap_content` bajo `posts/<uid>/` reutilizando
  `uploadEditorImage()` y su RLS.
- **Listado:** filtro segmentado Todos/Publicados/Borradores + búsqueda por
  título. Cards simples que enlazan a la edición (sin acciones rápidas en la
  card; publicar/eliminar viven en la página del post).

#### Enfoque técnico
- **Editor con carga diferida:** `next/dynamic` con `ssr: false` en
  `PostForm` — Tiptap arrastra lowlight/yjs y solo se paga en `/posts/new` y
  `/posts/[id]` (regla `bundle-dynamic-imports`).
- **Contenido en un ref:** el HTML del editor cambia en cada tecla pero solo
  se lee al guardar, así que vive en `contentRef` (no en estado) y el
  formulario no se re-renderiza mientras se escribe
  (`rerender-use-ref-transient-values`). El editor recibe un `initialContent`
  estable para no resetear el cursor.
- **Errores accionables:** el código Postgres `23505` (slug duplicado) se
  traduce a un mensaje claro; validación de título/contenido antes de guardar
  (HTML «vacío» de Tiptap detectado por regex).
- **`/posts/[id]`** valida el formato UUID antes de consultar (evita un error
  de Postgres con ids arbitrarios) y hace `notFound()` si no existe.
- **`next/image` con `remotePatterns`** para el host del Storage de Supabase
  (miniaturas de cover en cards y banner en el formulario).
- **`ButtonLink`** añadido en `Button.tsx`: navegación (`<Link>`) con la
  apariencia exacta del botón, sin anidar interactivos.
- **Fechas deterministas** en `PostCard` (`Intl.DateTimeFormat` con locale y
  zona fijas, hoisted a módulo) para que SSR e hidratación coincidan.

#### Flujos
- **Crear:** `/posts/new` → escribir → «Publicar» o «Guardar borrador» →
  `createPost()` (con `user_id` de la sesión) → `router.replace('/posts/[id]')`.
- **Editar:** RSC carga el post → guardar hace `updatePost()`; si está
  publicado el botón único es «Guardar» y «Despublicar» vive en Ajustes.
- **Eliminar:** Ajustes → «Eliminar post» → diálogo de confirmación →
  `deletePost()` → `router.replace('/posts')`.

#### Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `lib/validators/post.ts` | `slugify()` + validación de título y de HTML vacío |
| `lib/supabase/posts.ts` | Mutaciones `createPost` / `updatePost` / `deletePost` (cliente browser) |
| `lib/hooks/usePosts.ts` | Hook de mutaciones con `pending`/`error` + `router.refresh()` |
| `components/posts/PostCard.tsx` | Fila-tarjeta con cover, badge de estado, destacado y fecha |
| `components/posts/PostList.tsx` | Filtro segmentado + búsqueda + estados vacíos |
| `components/posts/PostForm.tsx` | Página de escritura Notion-style + diálogo Ajustes + confirmación de borrado |
| `app/(dashboard)/posts/new/page.tsx` | Ruta de creación |
| `app/(dashboard)/posts/[id]/page.tsx` | Ruta de edición (RSC + `notFound`) |

#### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/(dashboard)/posts/page.tsx` | Placeholder → listado real cargado en el servidor (filtrado por `user_id` del JWT) |
| `components/common/Button.tsx` | Se exporta `ButtonLink` (mismos estilos sobre `next/link`) |
| `next.config.ts` | `images.remotePatterns` para el Storage de Supabase |

#### Verificación
- `tsc --noEmit` ✅ · `eslint` ✅ · `next build` ✅
- Runtime: `/posts`, `/posts/new`, `/posts/[uuid]`, `/posts/no-uuid` → 307 a
  `/login` sin sesión (protegidas por el proxy).
- Pendiente de prueba manual con sesión: crear/editar/publicar/eliminar y
  subida de portada (requiere login en el navegador).

---
## Fase 5 — CRUD de Proyectos
**Fecha:** 2026-07-01

### Qué se hizo

CRUD completo de proyectos, espejo de la Fase 4 con los campos propios del
dominio: `description`, `github_url`, `demo_url` y `tags text[]` (sin
slug/featured/excerpt, que son de posts).

#### Decisiones (confirmadas con el usuario)
- **Listado en grid de cards** (2–3 columnas): cover arriba en `aspect-video`,
  título con badge de estado, descripción (`line-clamp-2`) y chips de tags.
  Más visual que las filas de posts, apropiado para un portfolio.
- **Tags como chips con filtro:** input de chips en Ajustes (Enter o coma
  agrega, X o Backspace quita); en el listado los tags únicos aparecen como
  chips clicables que filtran junto al estado y la búsqueda.
- **`github_url`/`demo_url` en Ajustes:** consistente con la Fase 4 (vista de
  escritura limpia), con validación de formato http(s) al guardar.

#### Enfoque técnico
- **Refactor DRY sobre la Fase 4:**
  - `lib/validators/html.ts`: `isEmptyHtml()` compartido (antes duplicado en
    el validador de posts); `post.ts` y `project.ts` lo importan.
  - `lib/hooks/useMutationRunner.ts`: runner compartido (pending/error +
    `router.refresh()`); `usePosts` y `useProjects` quedan como wrappers
    finos por dominio.
- **Mismos patrones de la Fase 4:** editor con `next/dynamic` (ssr: false),
  contenido en ref, `initialContent` estable, validación UUID en la ruta
  dinámica, `notFound()`, portada vía `uploadEditorImage(file, 'projects')`
  (carpeta `projects/<uid>/` exigida por la RLS del bucket).
- **Guardado de tags defensivo:** si el usuario deja texto en el input de
  tags sin presionar Enter, se incluye normalizado al guardar.
- **Filtrado combinado en una sola pasada** (estado + búsqueda + tag activo).

#### Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `lib/validators/html.ts` | `isEmptyHtml()` compartido entre posts y proyectos |
| `lib/validators/project.ts` | Validación de título/contenido/URLs + `normalizeTag()` |
| `lib/supabase/projects.ts` | Mutaciones `createProject` / `updateProject` / `deleteProject` |
| `lib/hooks/useMutationRunner.ts` | Runner compartido de mutaciones (pending/error/refresh) |
| `lib/hooks/useProjects.ts` | Hook de mutaciones de proyectos |
| `components/projects/ProjectCard.tsx` | Card de grid con cover, badge, descripción y tags |
| `components/projects/ProjectList.tsx` | Grid + filtro de estado + búsqueda + filtro por tag |
| `components/projects/ProjectForm.tsx` | Página Notion-style + Ajustes (descripción, URLs, tags, portada) |
| `app/(dashboard)/projects/new/page.tsx` | Ruta de creación |
| `app/(dashboard)/projects/[id]/page.tsx` | Ruta de edición (RSC + `notFound`) |

#### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/(dashboard)/projects/page.tsx` | Placeholder → grid real cargado en el servidor |
| `lib/validators/post.ts` | Usa `isEmptyHtml()` compartido |
| `lib/hooks/usePosts.ts` | Refactor sobre `useMutationRunner` (API sin cambios) |

#### Verificación
- `tsc --noEmit` ✅ · `eslint` ✅ · `next build` ✅
- Runtime: `/projects`, `/projects/new`, `/projects/[uuid]`, `/projects/no-uuid`
  → 307 a `/login` sin sesión (protegidas por el proxy).
- Pendiente de prueba manual con sesión: crear/editar/publicar/eliminar,
  tags y subida de portada (requiere login en el navegador).

---
## Fase 6 — Características Avanzadas (búsqueda, filtros, paginación)
**Fecha:** 2026-07-01

### Qué se hizo

Los listados de posts y proyectos pasan de filtrado client-side (Fases 4/5) a
**estado en la URL + consultas en el servidor**, y ganan paginación numerada.

#### Decisiones (confirmadas con el usuario)
- **URL + servidor:** filtros, búsqueda, tag y página viven en la URL
  (`?status=draft&q=next&tag=react&page=2`) y la consulta corre en el RSC con
  Supabase (`.range()` + `count: 'exact'`). URLs compartibles y escala con
  muchos registros.
- **Sin tags en posts:** los tags quedan solo en proyectos (las tablas
  `tags`/`posts_tags` siguen reservadas para el futuro); el filtro por tag de
  proyectos se movió a la URL/servidor (`.contains('tags', [tag])`).
- **Paginación numerada:** contador de resultados + « Anterior · 1 … n ·
  Siguiente » con ventana compacta (1 … actual±1 … última). 10 posts / 9
  proyectos por página.
- **Búsqueda en título + excerpt/descripción:** `or(ilike)` en servidor; el
  término se sanea (`%_"\` fuera) para no romper la sintaxis de PostgREST ni
  inyectar comodines. Sintaxis validada contra la API REST de Supabase (200).

#### Enfoque técnico
- **`lib/list-params.ts`:** parseo/saneo de `searchParams` compartido
  (status/q/page/tag) + tamaños de página.
- **`useListFilters`:** hook cliente que lee la URL y aplica cambios con
  `router.replace` dentro de `useTransition` (spinner de pendiente en la
  búsqueda, regla `rendering-usetransition-loading`); cambiar un filtro
  siempre resetea a la página 1.
- **Controles como componentes cliente finos:** `StatusFilterTabs`,
  `SearchInput` (debounce 300 ms por handler de evento, sin efectos),
  `Pagination` (Links puros) y `TagFilterChips`.
- **`PostList`/`ProjectList` quedan presentacionales** (server-compatible):
  solo mapean cards; los estados vacíos («aún no hay» vs «sin resultados») se
  deciden en la página según `total` y si hay filtros activos.
- **Página fuera de rango** (`PGRST103` de PostgREST al editar `?page=` a
  mano): `redirect()` a la página 1 en el servidor.
- **Proyectos:** la lista paginada y el agregado de tags para los chips se
  consultan en paralelo con `Promise.all` (regla `async-parallel`).
- **Drafts vs Published:** badge de estado (Publicado/Borrador) ahora visible
  también en la cabecera de los formularios de edición.

#### Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `lib/list-params.ts` | Parseo/saneo del estado del listado en la URL + page sizes |
| `lib/hooks/useListFilters.ts` | Lee/escribe searchParams con transición pendiente |
| `components/common/StatusFilterTabs.tsx` | Segmentado Todos/Publicados/Borradores → `?status=` |
| `components/common/SearchInput.tsx` | Búsqueda con debounce → `?q=` (con spinner) |
| `components/common/Pagination.tsx` | Contador + navegación numerada por URL |
| `components/projects/TagFilterChips.tsx` | Chips de tag → `?tag=` (toggle) |

#### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/(dashboard)/posts/page.tsx` | Query con filtros/búsqueda/`range` en servidor + paginación + redirect fuera de rango |
| `app/(dashboard)/projects/page.tsx` | Ídem + filtro por tag + agregado de tags en paralelo |
| `components/posts/PostList.tsx` | De client con filtros → lista presentacional |
| `components/projects/ProjectList.tsx` | De client con filtros → grid presentacional |
| `components/posts/PostForm.tsx` | Badge de estado en la cabecera |
| `components/projects/ProjectForm.tsx` | Badge de estado en la cabecera |

#### Verificación
- `tsc --noEmit` ✅ · `eslint` ✅ · `next build` ✅
- Runtime: `/posts?status=draft&q=…&page=2` y `/projects?tag=…&page=99` →
  307 a `/login` sin sesión (protegidas, params preservados).
- Sintaxis PostgREST validada contra la API real: `or=(title.ilike."%next
  js%",…)` → 200 · `tags=cs.{react}` → 200.
- Pendiente de prueba manual con sesión: filtros/búsqueda/paginación con
  datos reales.

---

## Fase 7 — Analíticas
**Fecha:** 2026-07-02

### Qué se hizo

Contadores de visitas del sitio público (páginas, posts y proyectos): ingesta
segura en Supabase vía RPC, agregación con vistas SQL y dashboard de
analíticas con serie temporal y rankings.

#### Decisiones de diseño (refinadas)
- **Ingesta vía RPC `track_view()`, no INSERT directo.** La policy
  `analytics_insert` (INSERT abierto con la anon key, de la Fase 0) se
  eliminó: permitía a cualquiera insertar filas arbitrarias. Ahora la única
  vía de escritura es una función `SECURITY DEFINER` que valida y descarta en
  silencio lo malformado.
- **Visitantes únicos con UUID anónimo en localStorage.** El sitio público
  genera un UUID por navegador y lo manda como `visitor_id`. Sin IPs ni
  fingerprinting (privacidad); suficiente precisión para un portfolio.
- **Eventos crudos + vistas SQL de agregación.** Cada visita es una fila; el
  dashboard consulta vistas (`analytics_daily`, `analytics_summary`,
  `analytics_top_posts`, `analytics_top_projects`). A esta escala el tier
  gratuito tarda años en llenarse; si crece, se añade un rollup sin migrar.
- **Vistas con `security_invoker = true`:** heredan el RLS de `analytics`
  (SELECT solo autenticado), así ni los datos crudos ni los agregados son
  legibles con la anon key.

#### Migraciones aplicadas (`fase_7_analytics_track_view`, `fix_handle_updated_at_search_path`)
- `resource_type` ahora es NOT NULL con CHECK (`page|post|project`) y CHECK
  de coherencia con `resource_id` (page → null; post/project → obligatorio).
- Índices: `viewed_at desc`, `(resource_type, resource_id)` y
  `(visitor_id, page_path, viewed_at desc)` para la deduplicación.
- **`track_view(p_page_path, p_resource_type, p_resource_id, p_visitor_id,
  p_referrer, p_user_agent)`:** valida la ruta (empieza con `/`, ≤300
  chars), verifica que el post/proyecto exista y esté **publicado**,
  deduplica (mismo visitante + misma ruta = 1 visita cada 30 min) y trunca
  los campos de texto. EXECUTE para `anon` y `authenticated`.
- El warning de los advisors «anon puede ejecutar SECURITY DEFINER» sobre
  `track_view` es **intencional**: es el punto de entrada público de la
  telemetría y solo puede insertar eventos validados.
- Bonus: `handle_updated_at()` (Fase 0) ahora fija `search_path = ''`
  (resolvía un WARN del linter de seguridad).

#### Dashboard
- **`/analytics`:** tarjetas de totales (visitas, únicos, posts, proyectos),
  gráfico de barras de visitas por día (últimos 30 días, días sin datos = 0)
  y rankings de posts/proyectos más vistos con únicos. Empty state si aún no
  hay visitas.
- **Gráfico (`ViewsChart`):** serie única en el púrpura `--accent` (validado
  contra las superficies light y dark con el validador de dataviz), barras
  ≤24px con tope redondeado y gap de 2px, gridlines hairline, tooltip por
  barra (valor primero, fecha después) y tabla `sr-only` como alternativa
  accesible. Sin leyenda (una sola serie: el título de la carta la nombra).
- **Dashboard principal (`/`):** las tarjetas ahora muestran datos reales
  (conteo de posts, proyectos, publicados y visitas totales) cargados en
  paralelo con `Promise.all`.

#### Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `lib/supabase/analytics.ts` | Fetchers server-side de las vistas de agregación |
| `components/analytics/ViewsChart.tsx` | Barras de visitas/día con tooltips (client) |
| `components/analytics/TopResourceList.tsx` | Ranking de posts/proyectos más vistos |

#### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `lib/types.ts` | Views + Functions en `Database`; tipos de agregados |
| `app/(dashboard)/analytics/page.tsx` | De placeholder a dashboard de analíticas (RSC) |
| `app/(dashboard)/page.tsx` | Tarjetas con métricas reales + enlace a Analíticas |

#### Integración en el sitio público (otro repo)

El frontend público solo necesita la anon key y esta llamada en cada vista:

```ts
// lib/track-view.ts (en el repo del portfolio público)
import { supabase } from './supabase';

function getVisitorId(): string {
  const KEY = 'visitor_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function trackView(
  resourceType: 'page' | 'post' | 'project' = 'page',
  resourceId?: string // uuid del post/proyecto; omitir para páginas
) {
  // fire-and-forget: nunca debe romper la navegación
  supabase
    .rpc('track_view', {
      p_page_path: location.pathname,
      p_resource_type: resourceType,
      p_resource_id: resourceId ?? null,
      p_visitor_id: getVisitorId(),
      p_referrer: document.referrer || null,
      p_user_agent: navigator.userAgent,
    })
    .then(({ error }) => {
      if (error) console.warn('track_view:', error.message);
    });
}
```

Llamar `trackView()` al montar cada página (en Next.js, un `useEffect` sobre
`usePathname`; en React Router, sobre `useLocation`). Para posts/proyectos,
pasar el tipo y el uuid: `trackView('post', post.id)`. Solo cuentan recursos
**publicados**; las visitas al mismo path por el mismo visitante se agrupan
en ventanas de 30 minutos.

#### Verificación
- `tsc --noEmit` ✅ · `eslint` ✅ · `next build` ✅
- `track_view` probado en SQL: 5 llamadas (duplicado, ruta inválida y post
  inexistente incluidos) → solo 2 filas insertadas; datos de prueba borrados.
- Advisors de seguridad revisados: sin issues nuevos salvo el WARN
  intencional de `track_view` (documentado arriba).
- Pendiente de prueba manual: abrir `/analytics` con sesión y verificar el
  gráfico con visitas reales del sitio público.

---

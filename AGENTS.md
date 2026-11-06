# AGENTS.md - Guía del agente

Este mapa es una guía no un archivo de reglas. Aquí los agentes sabran donde navegar para saber contexto, tareas, decisiones y arquitectura.

## Mapa del proyecto

| Ruta                   | Qué vive dentro                                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [CLAUDE.md](CLAUDE.md) | Guía principal: roles de agentes (Manager, Implementador, Reviewer), scripts de pnpm, stack, arquitectura y reglas del proyecto. |
| [AGENTS.md](AGENTS.md) | Este mapa: dónde buscar contexto, decisiones y código.                                                                           |

### docs/

Documentación viva que mantienen los agentes.

| Ruta                                                             | Qué vive dentro                                                               |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [docs/decisiones/decisions.md](docs/decisiones/decisions.md)     | Registro de decisiones técnicas y de arquitectura (qué se decidió y por qué). |
| [docs/exploraciones/explorer.md](docs/exploraciones/explorer.md) | Hallazgos de exploración del código, investigaciones y pruebas de concepto.   |
| [docs/memoria/memory.md](docs/memoria/memory.md)                 | Memoria compartida entre sesiones: contexto, estado de tareas y pendientes.   |

### app/ (Next.js App Router)

| Ruta                                                                       | Qué vive dentro                                                                                      |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [app/layout.tsx](app/layout.tsx)                                           | Root layout: metadata global, fuentes, script de tema y providers.                                   |
| [app/globals.css](app/globals.css)                                         | Estilos globales y tokens de TailwindCSS v4.                                                         |
| [app/(dashboard)/layout.tsx](<app/(dashboard)/layout.tsx>)                 | Layout del dashboard (AppShell con sidebar y header).                                                |
| [app/(dashboard)/page.tsx](<app/(dashboard)/page.tsx>)                     | Home del dashboard.                                                                                  |
| [app/(dashboard)/posts/](<app/(dashboard)/posts/>)                         | Listado de posts (draft / posted / archived), `new/` para crear y `[id]/` para editar con el editor. |
| [app/(dashboard)/projects/](<app/(dashboard)/projects/>)                   | Listado de proyectos, `new/` para crear y `[id]/` para editar.                                       |
| [app/(dashboard)/analytics/page.tsx](<app/(dashboard)/analytics/page.tsx>) | Página de analíticas (vistas y recursos top).                                                        |

### components/

| Ruta                                                           | Qué vive dentro                                                                                                                   |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| [components/common/](components/common/)                       | Componentes reutilizables: Button, Dialog, EmptyState, Input, PageHeader, Pagination, SearchInput, StatusFilterTabs, ThemeToggle. |
| [components/layout/](components/layout/)                       | Estructura de página: AppShell, Header, Sidebar, Footer, ThemeProvider.                                                           |
| [components/editor/](components/editor/)                       | Editor HTML con TipTap 3 (TiptapEditor), menú de slash commands y sus estilos.                                                    |
| [components/editor/extensions/](components/editor/extensions/) | Extensiones propias de TipTap (slash command).                                                                                    |
| [components/posts/](components/posts/)                         | PostCard, PostForm y PostList.                                                                                                    |
| [components/projects/](components/projects/)                   | ProjectCard, ProjectForm, ProjectList y TagFilterChips.                                                                           |
| [components/analytics/](components/analytics/)                 | Gráfica de vistas (ViewsChart) y lista de recursos top.                                                                           |

### hooks/

| Ruta                                                     | Qué vive dentro                                                   |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| [hooks/useListFilters.ts](hooks/useListFilters.ts)       | Estado de filtros, búsqueda y paginación sincronizado con la URL. |
| [hooks/useMutationRunner.ts](hooks/useMutationRunner.ts) | Ejecuta mutaciones (crear/editar) con estado de carga y error.    |
| [hooks/usePosts.ts](hooks/usePosts.ts)                   | Mutaciones de posts (crear/editar/borrar) sobre useMutationRunner. |
| [hooks/useProjects.ts](hooks/useProjects.ts)             | Mutaciones de proyectos (crear/editar/borrar) sobre useMutationRunner. |
| [hooks/useTheme.ts](hooks/useTheme.ts)                   | Tema actual y setter sobre el store de lib/theme.                 |

### lib/

| Ruta                                                                                   | Qué vive dentro                                                                   |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [lib/list-params.ts](lib/list-params.ts)                                               | Parámetros de listados en la URL (status, q, tag, page) y tamaños de página.      |
| [lib/supabase/tables.ts](lib/supabase/tables.ts)                                       | Nombres de tablas y vistas de analytics configurables por env `NEXT_PUBLIC_SUPABASE_*` (con valores por defecto). |
| [lib/supabase/client.ts](lib/supabase/client.ts) / [server.ts](lib/supabase/server.ts) | Clientes de Supabase para navegador y servidor (`@supabase/ssr`).                 |
| [lib/supabase/posts.ts](lib/supabase/posts.ts)                                         | Crear y actualizar posts.                                                         |
| [lib/supabase/projects.ts](lib/supabase/projects.ts)                                   | Crear y actualizar proyectos.                                                     |
| [lib/supabase/analytics.ts](lib/supabase/analytics.ts)                                 | Consultas de analíticas por rango de días.                                        |
| [lib/supabase/storage.ts](lib/supabase/storage.ts)                                     | Subida de imágenes del editor a Supabase Storage (bucket configurable por `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`, tipos y tamaño máximo de 1 MB). |
| [lib/theme/store.ts](lib/theme/store.ts)                                               | Store externo del tema (localStorage + matchMedia) para useSyncExternalStore.     |

### utils/

| Ruta                                   | Qué vive dentro                                                                  |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| [utils/theme/](utils/theme/)           | Script anti-parpadeo del tema claro/oscuro (themeScript) y su clave de storage. |
| [utils/validators/](utils/validators/) | Funciones puras de validación: HTML vacío, slug, posts y proyectos.              |

### types/

| Ruta               | Qué vive dentro                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| [types/](types/)   | Un archivo por dominio: json, database, post, project, tag, image, analytics, list-params, editor y theme. |

### public/

| Ruta               | Qué vive dentro                                       |
| ------------------ | ----------------------------------------------------- |
| [public/](public/) | Archivos estáticos servidos tal cual (imágenes, SVG). |

---

## Iniciar validación de que el proyecto no este roto al comenzar cualquier tarea / investigación / implementación, etc.

- Saber que el build no esta ROTO. `pnpm build`
- Saber que el lint no esta ROTO. `pnpm lint`

## Estructura al escribir en la memoria

```
Fecha - Contexto - Realizado por <nombre del agente>
```

## Estructura al escribir en las exploraciones

```
Fecha - Feature: <ID> - Contexto de la exploración - Decisiones tomadas
```

## Estructura al escribir en las decisiones

```
Fecha - contexto de la decision - Realizado por <nombre del agente> - aceptado por el humano?: <boolean>
```

Todas deben ser true, no deberia haber decisiones anotadas en falso.

# Blog Dashboard - CLAUDE.md

## 📋 Resumen

**Proyecto:** Dashboard profesional para crear y gestionar blog posts y proyectos con editor HTML/Markdown rich-text.

**Propósito:** Aplicación personal (MIT License) para un usuario que desea una herramienta fullstack moderna sin necesidad de servidor backend adicional.

**Stack:** Next.js 16.2.9 + React Router 8.0.1 + Tiptap 3.27.1 + Tailwind 4.3 + Supabase 2.108.2

**Estado:** Fase de planificación arquitectónica. Sin código escrito aún. Decisiones arquitectónicas pendientes de implementación.

**Estilo:** Un estilo minimalista los border width no mas de 1px. Un dashboard que sea moderno 2026 y el html editor debe ser muy similar al de Notion. Debe tener un tema light y un tema dark. Me gustaria un palette del light con toques blanco/gris y un palette del tema dark total blackout con los highlights en un purpura. El dashboard menu deberia poder ser colapsable y mostrar un menu que cuando el pointer pase por la izquierda este aparezca flotando y si se va de cierta zona del lado izquierda este pierda su opacidad y se vea solo el contenido de la pagina actual como en Notion. Los borded rounded que sean de 11px. No trates de hacer cards dentro de cards. Solo una carta y su contenido sin alguna carta dentro del texto, icono, entre otras cosas. 

**Instalar:** Instalar las dependencias restantes si todavia no estan instaladas, si ya lo estan entonces obviar hacer las instalaciones. 

---

## 🎯 Objetivo Principal

Crear un dashboard fullstack serverless que permita:
- ✅ Crear, editar y eliminar blog posts y proyectos
- ✅ Usar un editor HTML rich-text con soporte Markdown (Tiptap)
- ✅ Almacenar datos de forma persistente (PostgreSQL vía Supabase)
- ✅ Gestionar archivos/imágenes (Storage de Supabase)
- ✅ Autenticación de usuario (opcional, usuario único por ahora)
- ✅ Publicable como MIT License

---

## 📦 Stack Tecnológico Seleccionado

### Frontend (Cliente)

| Librería | Versión | Propósito | Justificación |
|----------|---------|----------|---------------|
| **Next.js** | 16.2.9 | Framework React fullstack | App Router, SSR opcional, despliegue en Vercel |
| **React** | 18.x (incluido en Next.js) | UI library | Componentes funcionales + hooks |
| **TypeScript** | 5.x | Tipado estático | Seguridad de tipos, mejor experiencia dev |
| **Tailwind CSS** | 4.3 | Framework CSS | Utilidades, tema oscuro, personalizable |
| **Lucide React** | 1.22.0 | Iconografía | Icons SVG ligeros, accesibles |
| **React Router** | 8.0.1 | Routing SPA | Cliente-side routing opcional (híbrido con Next.js) |

### Editor de Contenido

| Librería | Versión | Propósito | Justificación |
|----------|---------|----------|---------------|
| **Tiptap** | 3.27.1 | Rich HTML editor | Open-source, headless, soporta Markdown, extensible |

### Backend (Serverless)

| Servicio | Versión | Propósito | Justificación |
|----------|---------|----------|---------------|
| **Supabase** | 2.108.2 (supabase-js) | Backend BaaS | PostgreSQL + Auth + Storage + RLS |
| **PostgreSQL** | (Incluido Supabase) | Base de datos relacional | Almacenamiento posts, usuarios, metadatos |

### Infraestructura & Despliegue

| Plataforma | Costo | Propósito |
|-----------|------|----------|
| **Vercel** | Gratuito (tier personal) | Hosting Next.js, CI/CD automático |
| **Supabase** | Gratuito (500MB BD + 1GB storage) | Backend serverless |

---

## 🏗️ Decisión Arquitectónica: Serverless (SIN SERVIDOR BACKEND)

### ¿Por Qué NO Se Necesita Servidor Express/Node.js Adicional?

**Supabase proporciona TODO:**

✅ **PostgreSQL** - Base de datos relacional completa
✅ **API REST automática** - Supabase genera endpoints para cada tabla automáticamente
✅ **Autenticación** - Magic links, OAuth, contraseñas, JWT
✅ **Storage** - Almacenar imágenes, PDFs, archivos
✅ **RLS (Row-Level Security)** - Control de permisos a nivel de BD
✅ **Real-time** - WebSockets para actualizaciones en vivo (opcional)
✅ **Webhooks** - Triggers para eventos (opcional)

### Flujo de Datos

```
┌──────────────┐
│ Navegador    │
│ Next.js      │ (Vercel)
└──────┬───────┘
       │ fetch/axios
       ↓
┌────────────────────┐
│ Supabase Client JS │ (En el navegador)
│ supabase-js        │
└──────┬─────────────┘
       │ API REST & WebSockets
       ↓
┌────────────────────────────────────┐
│ Supabase Backend (Serverless)      │
│ - PostgreSQL                       │
│ - Authentication                   │
│ - Storage                          │
│ - RLS Policies                     │
└────────────────────────────────────┘
```

### Ventajas

| Ventaja | Impacto |
|---------|--------|
| **Costo $0** | Tier gratuito cubre caso personal |
| **Escalabilidad** | Paga solo por lo que usa |
| **Sin DevOps** | No administrar servidores |
| **Seguridad incorporada** | RLS automático, JWT, CORS |
| **Desarrollo ágil** | Focus en frontend |

---

## 📁 Estructura de Carpetas

```
blog-dashboard/
│
├── app/                              # Next.js App Router
│   ├── layout.tsx                   # Layout raíz
│   ├── page.tsx                     # Dashboard principal (/dashboard)
│   ├── posts/
│   │   ├── page.tsx                 # Lista de posts (/posts)
│   │   ├── [id]/
│   │   │   └── page.tsx             # Detalle/edición post (/posts/[id])
│   │   └── new/
│   │       └── page.tsx             # Crear post (/posts/new)
│   ├── projects/
│   │   ├── page.tsx                 # Lista proyectos (/projects)
│   │   ├── [id]/page.tsx            # Detalle proyecto (/projects/[id])
│   │   └── new/page.tsx             # Crear proyecto (/projects/new)
│   └── api/
│       └── auth/
│           └── [...nextauth]/route.ts # (Opcional: si se usa NextAuth)
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx               # Navegación superior
│   │   ├── Sidebar.tsx              # Navegación lateral (opcional)
│   │   └── Footer.tsx               # Pie de página
│   ├── editor/
│   │   ├── TiptapEditor.tsx         # Wrapper de Tiptap
│   │   ├── EditorToolbar.tsx        # Barra de herramientas
│   │   └── EditorPreview.tsx        # Preview HTML/Markdown
│   ├── posts/
│   │   ├── PostCard.tsx             # Tarjeta de post
│   │   ├── PostList.tsx             # Listado de posts
│   │   └── PostForm.tsx             # Formulario crear/editar
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectList.tsx
│   │   └── ProjectForm.tsx
│   └── common/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Dialog.tsx
│       └── Loading.tsx
│
├── lib/
│   ├── supabase.ts                  # Cliente Supabase inicializado
│   ├── types.ts                     # Tipos TypeScript compartidos
│   ├── constants.ts                 # Constantes globales
│   ├── utils.ts                     # Funciones utilitarias
│   ├── hooks/
│   │   ├── usePosts.ts              # Hook para gestionar posts
│   │   ├── useProjects.ts           # Hook para gestionar proyectos
│   │   ├── useAuth.ts               # Hook de autenticación
│   │   └── useEditorState.ts        # Estado del editor
│   ├── supabase/
│   │   ├── posts.ts                 # Queries/mutations posts
│   │   ├── projects.ts              # Queries/mutations proyectos
│   │   └── storage.ts               # Operaciones storage
│   └── validators/
│       ├── post.ts                  # Validación de posts
│       └── project.ts               # Validación de proyectos
│
├── styles/
│   ├── globals.css                  # Estilos globales + Tailwind
│   ├── editor.css                   # Estilos Tiptap
│   └── animations.css               # Animaciones personalizadas
│
├── public/                          # Assets estáticos
│   ├── images/
│   ├── icons/
│   └── favicon.ico
│
├── .env.local                       # Variables de entorno (NO commitear)
├── .env.example                     # Plantilla de variables
├── .gitignore                       # Ignorar archivos
│
├── package.json                     # Dependencias
├── tsconfig.json                    # Configuración TypeScript
├── tailwind.config.ts               # Configuración Tailwind
├── postcss.config.js                # Configuración PostCSS
├── next.config.ts                   # Configuración Next.js
│
├── CLAUDE.md                        # Este archivo
├── README.md                        # Documentación para usuarios
└── TODO.md                          # Tareas pendientes
```

---

## 🗄️ Esquema de Base de Datos (PostgreSQL)

Ya dentro de nuestras tablas tenemos algunos creados si ya el nombre existe vamos a refactorizarlos y seguir este esquema. Ademas me gustaría agregar analiticas para ver si alguien ve mis posts o proyectos. Ademas de ver la página.

Cada post y proyecto cuenta con imagenes así que estructura bien la base de datos incluyendo este factor dentro del contenido en el html editor y donde esta información se va a utilizar.

### Tabla: posts

```sql
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  content text not null,  -- HTML de Tiptap
  excerpt text,           -- Resumen corto
  slug text unique,       -- Para URLs amigables
  published boolean default false,
  featured boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Índices para performance
create index idx_posts_user_id on posts(user_id);
create index idx_posts_published on posts(published);
create index idx_posts_created_at on posts(created_at desc);

-- RLS: Usuarios solo ven/editan sus propios posts
alter table posts enable row level security;
create policy "Users can CRUD own posts" on posts
  for all using (auth.uid() = user_id);
```

### Tabla: projects

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,      -- Descripción corta
  content text not null, -- Contenido HTML de Tiptap
  github_url text,       -- Link a repositorio (opcional)
  demo_url text,         -- Link a demo (opcional)
  published boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Índices
create index idx_projects_user_id on projects(user_id);
create index idx_projects_published on projects(published);

-- RLS: Usuarios solo ven/editan sus propios proyectos
alter table projects enable row level security;
create policy "Users can CRUD own projects" on projects
  for all using (auth.uid() = user_id);
```

### Tabla: tags (Opcional)

```sql
create table tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  slug text unique,
  created_at timestamp default now()
);

-- Junction table: posts_tags
create table posts_tags (
  post_id uuid references posts(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (post_id, tag_id)
);
```

### Tabla: images (Storage - Optional, para metadata)

```sql
create table images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  file_path text not null,      -- Path en Supabase Storage
  file_size int,                -- Bytes
  mime_type text,               -- image/jpeg, etc
  uploaded_at timestamp default now()
);

-- RLS
alter table images enable row level security;
create policy "Users can CRUD own images" on images
  for all using (auth.uid() = user_id);
```

---

## 🔐 Políticas de Seguridad (RLS)

### Row-Level Security Habilitadas Por Defecto

Todas las tablas de usuario deben tener RLS activo:

```sql
-- Ver posts publicados (públicos) + propios (privados)
create policy "Public posts visible" on posts
  for select using (published = true or auth.uid() = user_id);

-- Solo el dueño puede insertar/actualizar/eliminar
create policy "User owns posts" on posts
  for insert with check (auth.uid() = user_id);

create policy "User can update own posts" on posts
  for update using (auth.uid() = user_id);

create policy "User can delete own posts" on posts
  for delete using (auth.uid() = user_id);
```

### Variables de Entorno

```env
# .env.local (NO commitear)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Opcional: para operaciones admin
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## 🎨 Componentes Principales

### 1. TiptapEditor

**Responsabilidad:** Renderizar y gestionar el editor HTML con Tiptap

**Props:**
```typescript
interface TiptapEditorProps {
  value: string;                    // HTML content
  onChange: (html: string) => void; // Callback al cambiar
  onMarkdownToggle?: boolean;       // Toggle Markdown preview
  disabled?: boolean;               // Estado deshabilitado
}
```

**Características:**
- Soporte Markdown (entrada)
- Salida HTML limpia
- Toolbar con botones de formato
- Preview HTML/Markdown
- Upload de imágenes (integración Supabase Storage)

### 2. PostCard

**Responsabilidad:** Mostrar tarjeta individual de post

**Props:**
```typescript
interface PostCardProps {
  post: Post;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string) => void;
}
```

### 3. PostForm

**Responsabilidad:** Formulario para crear/editar posts

**Estados:**
- Borrador (sin publicar)
- Publicado (visible)
- Cargando
- Error

### 4. Header

**Responsabilidad:** Navegación y autenticación

**Elementos:**
- Logo/Branding
- Nav links (Dashboard, Posts, Proyectos)
- Selector de tema (claro/oscuro)
- Menu usuario

---

## 📊 Flujos Principales

### Crear Post

```
Usuario abre /posts/new
    ↓
Form monta TiptapEditor
    ↓
Usuario escribe contenido
    ↓
Click "Publicar" (o "Guardar como borrador")
    ↓
Validar (título, contenido no vacío)
    ↓
supabase.from('posts').insert({ ... })
    ↓
Supabase aplica RLS (user_id = auth.uid())
    ↓
Redirect a /posts/[id]
```

### Listar Posts

```
Usuario abre /posts
    ↓
useEffect fetch: supabase.from('posts').select()
    ↓
Supabase RLS filtra: published=true OR user_id=auth.uid()
    ↓
Mostrar PostList con tarjetas
```

### Subir Imagen (en editor)

```
Usuario click "Upload image" en toolbar
    ↓
File input → seleccionar imagen
    ↓
supabase.storage.from('posts-images').upload(file)
    ↓
Obtener URL pública
    ↓
Insertar <img> en contenido Tiptap
```

---

## 🧪 Testing y Calidad

### Configuración Recomendada

```json
{
  "devDependencies": {
    "vitest": "latest",
    "testing-library/react": "latest",
    "@testing-library/jest-dom": "latest",
    "msw": "latest",
    "eslint": "latest",
    "prettier": "latest"
  }
}
```

### Convenciones de Código

- **Componentes:** PascalCase (`PostCard.tsx`)
- **Funciones utilitarias:** camelCase (`parseMarkdown.ts`)
- **Constantes:** UPPER_SNAKE_CASE
- **Tipos:** PascalCase (`interface Post {}`)
- **Archivos:** kebab-case para archivos utilitarios

### Prettier Config

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

---

## 📝 Tipos TypeScript Core

```typescript
// User
interface User {
  id: string;
  email: string;
  created_at: string;
}

// Post
interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;      // HTML de Tiptap
  excerpt?: string;
  slug: string;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

// Project
interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  content: string;      // HTML de Tiptap
  github_url?: string;
  demo_url?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

// Tag
interface Tag {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  created_at: string;
}
```

---

## 🔗 Recursos Útiles

Te dejare unas documentaciones pero no dudes de utilizar el mcp de Context7 para buscar los documentos actualizados de todas las herramientas. Preferiblemente utiliza el MCP. 

### Documentación Oficial

- [Next.js 16 Docs](https://nextjs.org/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Tiptap Editor](https://tiptap.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [React Router v8](https://reactrouter.com)

### Guías Recomendadas

- [Supabase RLS Security Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Authentication Patterns](https://nextjs.org/docs/app/building-your-application/authentication)
- [Tiptap Extensions](https://tiptap.dev/guide/extensions)

### Herramientas

- **Vercel CLI:** `npm i -g vercel`
- **Supabase CLI:** `npm i -g supabase`
- **Type Checker:** `tsc --noEmit`

---

## ⚙️ Configuración de Desarrollo

### Requisitos

- Node.js 18+
- npm 9+ o yarn 3+
- Git

### Scripts npm

```bash
npm run dev          # Inicia servidor dev (port 3000)
npm run build        # Build para producción
npm start            # Inicia servidor producción
npm run lint         # ESLint
npm run type-check   # TypeScript checker
npm run format       # Prettier format
npm test             # Correr tests (Vitest)
```

### Variables de Entorno

**Requeridas:**
```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Opcionales:**
```env
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_NAME
NEXT_PUBLIC_APP_URL
```

---

## 📄 Licencia

MIT License - Libre para usar, modificar y distribuir.

Incluir en `LICENSE` archivo y `package.json`:
```
Copyright (c) 2025 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy...
```

---

## 📌 Notas Importantes

### ⚠️ NO Hacer

- ❌ Commitear `.env.local` o credenciales
- ❌ Usar `eval()` o código dinámico inseguro
- ❌ Almacenar contraseñas en cliente
- ❌ Confiar únicamente en validación frontend (validar en BD)
- ❌ Ignorar RLS en Supabase (es la única línea de defensa en cliente)

### ✅ Hacer

- ✅ Verificar que se esten utilizando buenas practicas con el skill de /vercel-react-best-practices 
- ✅ Siempre validar en backend (Supabase RLS) utilizando el MCP
- ✅ Usar TypeScript
- ✅ Sanitizar entrada de usuarios
- ✅ Usar `.env.example` para documentar variables
- ✅ Commitear `package-lock.json` o `yarn.lock`
- ✅ Escribir tests para lógica crítica
- ✅ Revisar seguridad de Supabase regularmente
- ✅ Realizar un archivo .md si no existe para documentar lo que se implementa con la fecha de modificación. Al existir entonces simplemente ve añadiendo todo lo que se implementa o cambia con su fecha.

---

## 🎯 Prioridades de Implementación

### MVP (Mínimo Viable)

1. Autenticación básica (email)
2. CRUD de posts
3. Editor Tiptap simple
4. Listado y filtrado básico
5. Deploy a Vercel

### Después del MVP

6. Proyectos (CRUD)
7. Tags/Categories
8. Upload de imágenes
9. Search
10. Dark mode completo
11. Analytics (opcional)

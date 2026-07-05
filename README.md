# Blog Dashboard

A modern, serverless dashboard for authoring and managing **blog posts** and **project posts**, built around a Notion-style rich-text editor. It's the tool I use to write and publish the content for my personal portfolio — open-sourced so you can see how it's put together.

No custom backend server required: [Supabase](https://supabase.com) provides the PostgreSQL database, authentication, storage, and row-level security.

## Features

- ✍️ **Notion-style editor** — rich HTML editing with [Tiptap](https://tiptap.dev), Markdown shortcuts, a slash (`/`) command menu, drag handles, task lists, and code blocks with syntax highlighting.
- 📝 **Posts & projects CRUD** — create, edit, publish/unpublish, and delete both content types, with drafts, excerpts, slugs, and tags.
- 🖼️ **Image uploads** — images are stored in Supabase Storage and embedded directly in the editor.
- 📊 **Analytics** — track views on your posts, projects, and pages.
- 🔐 **Authentication** — email/password auth with session handling via `@supabase/ssr`.
- 🔒 **Row-Level Security** — every table is protected by RLS policies so data access is enforced at the database.
- 🎨 **Light & dark themes** — minimalist light palette and a blackout dark theme with purple highlights, plus a collapsible Notion-like sidebar.

## Tech Stack

- **[Next.js 16](https://nextjs.org)** (App Router) + **React 19** + **TypeScript**
- **[Tailwind CSS v4](https://tailwindcss.com)**
- **[Tiptap 3](https://tiptap.dev)** for the editor
- **[Supabase](https://supabase.com)** — PostgreSQL, Auth, Storage, RLS
- **[Lucide](https://lucide.dev)** icons

## Getting Started

### 1. Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io) (this repo uses a `pnpm-lock.yaml`)
- A free [Supabase](https://supabase.com) project

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Copy the example file and fill in the values from your Supabase project
(**Project Settings → API**):

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

> **Security note:** The `NEXT_PUBLIC_*` keys are safe to ship to the browser
> **only because Row-Level Security is enabled** on every table. Never commit
> `.env.local` or a `service_role` key. Make sure your RLS policies are in
> place before exposing any data.

### 4. Set up the database

Create the `posts`, `projects`, `tags`, `images`, and analytics tables in your
Supabase project, and enable RLS on each. The full schema and policies are
documented in [`IMPLEMENTATION.md`](./IMPLEMENTATION.md), and a `posts-images`
Storage bucket is required for image uploads.

### 5. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/            # Next.js App Router (auth, dashboard, posts, projects, analytics)
components/     # UI: editor, posts, projects, layout, common, analytics
lib/            # Supabase clients, hooks, validators, theme, types
public/         # Static assets
```

## Documentation

- [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) — detailed implementation log, database schema, and RLS policies (in Spanish).
- [`CLAUDE.md`](./CLAUDE.md) — architecture notes and design guidelines (in Spanish).

## License

[MIT](./LICENSE) © Christian Marin

Free to use, modify, and distribute.

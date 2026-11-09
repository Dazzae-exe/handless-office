# Hand less office

A modern, serverless dashboard for authoring and managing **posts**, built around a Notion-style rich-text editor. Every piece of content is a post with a free-text `type` (for example `blog` or `project`), so blog entries and portfolio projects live in the same place. It's the tool I use to write and publish the content for my personal portfolio — open-sourced so you can see how it's put together.

No custom backend server required: [Supabase](https://supabase.com) provides the PostgreSQL database, storage, and row-level security.

## Features

- ✍️ **Notion-style editor** — rich HTML editing with [Tiptap](https://tiptap.dev), Markdown shortcuts, a slash (`/`) command menu, drag handles, task lists, and code blocks with syntax highlighting.
- 📝 **Posts CRUD** — create, edit, publish/unpublish, and delete posts of any type, with drafts, descriptions, slugs, tags, and optional GitHub/website links.
- 🖼️ **Image uploads** — images are stored in Supabase Storage and embedded directly in the editor.
- 📊 **Analytics** — track views on your posts.
- 🔒 **Designed for Row-Level Security** — data access is enforced by the RLS policies you configure in Supabase (see setup).
- 🎨 **Light & dark themes** — minimalist light palette and a blackout dark theme with purple highlights, plus a collapsible Notion-like sidebar.

## Tech Stack

- **[Next.js 16](https://nextjs.org)** (App Router) + **React 19** + **TypeScript**
- **[Tailwind CSS v4](https://tailwindcss.com)**
- **[Tiptap 3](https://tiptap.dev)** for the editor
- **[Supabase](https://supabase.com)** — PostgreSQL, Storage, RLS
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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

> **Security note:** The publishable key is public by design; your data is
> protected only by the RLS policies you configure (see step 4). The app has no
> authentication, so anything granted to the `anon` role can be read or written
> by anyone with your URL and key. Never commit `.env.local` or a
> `service_role` key.

### 4. Set up the database

Create the following in your Supabase project. Column names and types must
match the TypeScript types in [`types/`](./types): the types are not generated
from your database, so a mismatch is **not** caught at build time and only
fails at runtime.

A ready-to-run script with everything below (tables, trigger, `track_view`,
views and RLS) is in
[`docs/exploraciones/f-010-migration.sql`](./docs/exploraciones/f-010-migration.sql).
**It is destructive:** it drops any existing `posts`, `projects`, `tags`,
`posts_tags` and analytics tables, views and data. Read it and back up first.

**Tables**

| Table              | Columns |
| ------------------ | ------- |
| `posts`            | `id` uuid PK, `type` text (free text, default `blog`), `title` text, `content` text, `description` text?, `slug` text? (unique), `cover_image` text?, `tags` text[], `github_url` text?, `website_url` text?, `published` bool, `featured` bool, `created_at` timestamptz, `updated_at` timestamptz |
| `images`           | `id` uuid PK, `user_id` uuid, `file_path` text, `file_name` text?, `file_size` int?, `mime_type` text?, `alt_text` text?, `uploaded_at` timestamptz |
| `analytics_events` | `id` uuid PK, `post_id` uuid FK → `posts.id` (on delete cascade), `visitor_id` text?, `referrer` text?, `user_agent` text?, `viewed_at` timestamptz |

`?` = nullable. `id`, `created_at`, `updated_at` and `uploaded_at` need
defaults (the app never sends them; `updated_at` is kept current by a
trigger). The app does not send `user_id` to `images`, so it must be nullable
or have a default.

**Recording views:** `analytics_events` is never written directly. The only
write path is the function
`track_view(p_post_id uuid, p_visitor_id text, p_referrer text, p_user_agent text)`
(`security definer`, executable by `anon`), which records a view only for
published posts. Anyone with your key can call it, so view counts can be
inflated.

**Analytics views** (read-only, see [`types/analytics.ts`](./types/analytics.ts))

| View                  | Columns |
| --------------------- | ------- |
| `analytics_summary`   | `total_views`, `unique_visitors` |
| `analytics_daily`     | `day`, `views`, `unique_visitors` |
| `analytics_top_posts` | `id`, `title`, `slug`, `views`, `unique_visitors`, `last_viewed_at` |

**Storage:** a **public** bucket named `tiptap_content` for editor image
uploads, with a 1 MB `file_size_limit` to match the app's check (see
[`lib/supabase/storage.ts`](./lib/supabase/storage.ts)).

**RLS:** enable RLS on every table and on the bucket. The dashboard has no
authentication and talks to Supabase with the publishable key (`anon` role),
so `anon` needs full CRUD on `posts` (the script grants it with a single
`for all ... using (true) with check (true)` policy). `analytics_events` has
RLS enabled and no policies, so it is only reachable through `track_view` and
the views.

> **Warning:** with this setup, anyone who has your project URL and
> publishable key can create, edit and delete your posts. Keep the dashboard
> private and choose your policies carefully.

**Custom names (optional).** To point the app at your own tables, views or
bucket, set any of these in `.env.local` (empty or unset = default). They are
inlined at build time, so rebuild after changing them.

| Variable                                | Default          | Applies to |
| --------------------------------------- | ---------------- | ---------- |
| `NEXT_PUBLIC_SUPABASE_POSTS_TABLE`      | `posts`          | posts table |
| `NEXT_PUBLIC_SUPABASE_IMAGES_TABLE`     | `images`         | images table |
| `NEXT_PUBLIC_SUPABASE_ANALYTICS_PREFIX` | `analytics_`     | prefix of the three analytics views (`summary`, `daily`, `top_posts`) |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`   | `tiptap_content` | image bucket |

### 5. Run the dev server

```bash
pnpm dev     # dev server
pnpm build   # production build
pnpm start   # serve the build
pnpm lint    # lint
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/            # Next.js App Router: dashboard, posts, analytics, 404/error pages
components/     # UI: editor, posts, layout, common, analytics
hooks/          # Client hooks (posts, list filters, mutations, theme)
lib/            # Supabase clients and queries, theme store, list params
utils/          # Pure helpers: validators, theme script
types/          # One file per domain type (post, image, analytics, ...)
docs/           # Decisions, explorations, feature list and shared memory
public/         # Static assets
```

## Documentation

- [`CLAUDE.md`](./CLAUDE.md) — architecture notes, stack and project rules (in Spanish).
- [`AGENTS.md`](./AGENTS.md) — map of the repo for agents (in Spanish).
- [`docs/`](./docs) — technical decisions, explorations, feature list and memory (in Spanish).

## License

[MIT](./LICENSE) © Christian Marin

Free to use, modify, and distribute.

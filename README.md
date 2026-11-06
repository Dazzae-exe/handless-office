# Hand less office

A modern, serverless dashboard for authoring and managing **blog posts** and **project posts**, built around a Notion-style rich-text editor. It's the tool I use to write and publish the content for my personal portfolio — open-sourced so you can see how it's put together.

No custom backend server required: [Supabase](https://supabase.com) provides the PostgreSQL database, storage, and row-level security.

## Features

- ✍️ **Notion-style editor** — rich HTML editing with [Tiptap](https://tiptap.dev), Markdown shortcuts, a slash (`/`) command menu, drag handles, task lists, and code blocks with syntax highlighting.
- 📝 **Posts & projects CRUD** — create, edit, publish/unpublish, and delete both content types, with drafts, excerpts, slugs, and tags.
- 🖼️ **Image uploads** — images are stored in Supabase Storage and embedded directly in the editor.
- 📊 **Analytics** — track views on your posts, projects, and pages.
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

**Tables**

| Table      | Columns |
| ---------- | ------- |
| `posts`    | `id` uuid PK, `user_id` uuid, `title` text, `content` text, `excerpt` text?, `slug` text?, `cover_image` text?, `published` bool, `featured` bool, `created_at` timestamptz, `updated_at` timestamptz |
| `projects` | `id` uuid PK, `user_id` uuid, `title` text, `description` text?, `content` text, `cover_image` text?, `github_url` text?, `demo_url` text?, `tags` text[], `published` bool, `created_at` timestamptz, `updated_at` timestamptz |
| `images`   | `id` uuid PK, `user_id` uuid, `file_path` text, `file_name` text?, `file_size` int?, `mime_type` text?, `alt_text` text?, `uploaded_at` timestamptz |

`?` = nullable. `id`, `created_at`, `updated_at` and `uploaded_at` need
defaults (the app never sends them). The app does not send `user_id` either,
so it must be nullable or have a default.

**Analytics views** (read-only, see [`types/analytics.ts`](./types/analytics.ts))

| View                     | Columns |
| ------------------------ | ------- |
| `analytics_summary`      | `total_views`, `unique_visitors`, `page_views`, `post_views`, `project_views` |
| `analytics_daily`        | `day`, `resource_type` (`post` \| `project` \| `page`), `views`, `unique_visitors` |
| `analytics_top_posts`    | `id`, `title`, `slug`, `views`, `unique_visitors`, `last_viewed_at` |
| `analytics_top_projects` | `id`, `title`, `views`, `unique_visitors`, `last_viewed_at` |

**Storage:** a **public** bucket named `tiptap_content` for editor image
uploads, with a 1 MB `file_size_limit` to match the app's check (see
[`lib/supabase/storage.ts`](./lib/supabase/storage.ts)).

**RLS:** enable RLS on every table and on the bucket. The dashboard has no
authentication and talks to Supabase with the publishable key (`anon` role),
so your policies must grant that role the access you want. Choose them
carefully: anything `anon` can write, anyone with your URL and key can write.

**Custom names (optional).** To point the app at your own tables, views or
bucket, set any of these in `.env.local` (empty or unset = default). They are
inlined at build time, so rebuild after changing them.

| Variable                                | Default          | Applies to |
| --------------------------------------- | ---------------- | ---------- |
| `NEXT_PUBLIC_SUPABASE_POSTS_TABLE`      | `posts`          | posts table |
| `NEXT_PUBLIC_SUPABASE_PROJECTS_TABLE`   | `projects`       | projects table |
| `NEXT_PUBLIC_SUPABASE_IMAGES_TABLE`     | `images`         | images table |
| `NEXT_PUBLIC_SUPABASE_ANALYTICS_PREFIX` | `analytics_`     | prefix of the four analytics views |
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
app/            # Next.js App Router: dashboard, posts, projects, analytics, 404/error pages
components/     # UI: editor, posts, projects, layout, common, analytics
hooks/          # Client hooks (posts, projects, list filters, mutations, theme)
lib/            # Supabase clients and queries, theme store, list params
utils/          # Pure helpers: validators, theme script
types/          # One file per domain type (post, project, analytics, ...)
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

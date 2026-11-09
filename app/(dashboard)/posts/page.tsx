import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FileText, Plus, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { parseListParams, POSTS_PAGE_SIZE } from '@/lib/list-params';
import { PageHeader } from '@/components/common/PageHeader';
import { ButtonLink } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusFilterTabs } from '@/components/common/StatusFilterTabs';
import { SearchInput } from '@/components/common/SearchInput';
import { Pagination } from '@/components/common/Pagination';
import { PostList } from '@/components/posts/PostList';
import { TagFilterChips } from '@/components/posts/TagFilterChips';
import { TypeFilterSelect } from '@/components/posts/TypeFilterSelect';

export const metadata: Metadata = { title: 'Posts' };

interface PostsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { status, q, page, tag, type } = parseListParams(await searchParams);
  const supabase = await createClient();

  let query = supabase.from(TABLES.posts).select('*', { count: 'exact' });
  if (status !== 'all') query = query.eq('published', status === 'published');
  if (q) query = query.or(`title.ilike."%${q}%",description.ilike."%${q}%"`);
  if (tag) query = query.contains('tags', [tag]);
  if (type) query = query.eq('type', type);

  const from = (page - 1) * POSTS_PAGE_SIZE;

  const [listRes, facetsRes] = await Promise.all([
    query.order('created_at', { ascending: false }).range(from, from + POSTS_PAGE_SIZE - 1),
    supabase.from(TABLES.posts).select('tags, type'),
  ]);

  // Página fuera de rango (URL editada a mano): vuelve a la página 1.
  if (listRes.error?.code === 'PGRST103') redirect('/posts');

  const { data: posts, count, error } = listRes;
  const facets = facetsRes.data ?? [];
  const allTags = [...new Set(facets.flatMap((row) => row.tags))];
  const allTypes = [...new Set(facets.map((row) => row.type))];

  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / POSTS_PAGE_SIZE));
  const hasFilters = status !== 'all' || q !== '' || tag !== null || type !== null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Posts"
        description="Crea y gestiona tus posts y proyectos."
        action={
          <ButtonLink href="/posts/new">
            <Plus className="h-4 w-4" />
            Nuevo post
          </ButtonLink>
        }
      />

      {error ? (
        <p role="alert" className="text-sm text-danger">
          No se pudieron cargar los posts: {error.message}
        </p>
      ) : total === 0 && !hasFilters ? (
        <EmptyState
          icon={FileText}
          title="Aún no hay posts"
          description="Escribe tu primera entrada."
          action={<ButtonLink href="/posts/new">Crear el primero</ButtonLink>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusFilterTabs />
            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
              <TypeFilterSelect types={allTypes} />
              <SearchInput
                placeholder="Buscar por título o descripción…"
                ariaLabel="Buscar posts"
              />
            </div>
          </div>

          <TagFilterChips tags={allTags} />

          {posts && posts.length > 0 ? (
            <PostList posts={posts} />
          ) : (
            <EmptyState
              icon={Search}
              title="Sin resultados"
              description="Ningún post coincide con el filtro o la búsqueda."
            />
          )}

          <Pagination page={page} pageCount={pageCount} total={total} />
        </div>
      )}
    </div>
  );
}

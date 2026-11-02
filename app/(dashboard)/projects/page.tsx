import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FolderGit2, Plus, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { parseListParams, PROJECTS_PAGE_SIZE } from '@/lib/list-params';
import { PageHeader } from '@/components/common/PageHeader';
import { ButtonLink } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusFilterTabs } from '@/components/common/StatusFilterTabs';
import { SearchInput } from '@/components/common/SearchInput';
import { Pagination } from '@/components/common/Pagination';
import { TagFilterChips } from '@/components/projects/TagFilterChips';
import { ProjectList } from '@/components/projects/ProjectList';

export const metadata: Metadata = { title: 'Proyectos' };

interface ProjectsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { status, q, page, tag } = parseListParams(await searchParams);
  const supabase = await createClient();

  let query = supabase.from('projects').select('*', { count: 'exact' });
  if (status !== 'all') query = query.eq('published', status === 'published');
  // `q` llega saneado de parseListParams (sin comodines ni comillas).
  if (q) query = query.or(`title.ilike."%${q}%",description.ilike."%${q}%"`);
  if (tag) query = query.contains('tags', [tag]);

  const from = (page - 1) * PROJECTS_PAGE_SIZE;

  const [listRes, tagsRes] = await Promise.all([
    query.order('created_at', { ascending: false }).range(from, from + PROJECTS_PAGE_SIZE - 1),
    supabase.from('projects').select('tags'),
  ]);

  // Página fuera de rango (URL editada a mano): vuelve a la página 1.
  if (listRes.error?.code === 'PGRST103') redirect('/projects');

  const { data: projects, count, error } = listRes;
  const allTags = [...new Set((tagsRes.data ?? []).flatMap((row) => row.tags))];

  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PROJECTS_PAGE_SIZE));
  const hasFilters = status !== 'all' || q !== '' || tag !== null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Proyectos"
        description="Documenta y gestiona los proyectos de tu portfolio."
        action={
          <ButtonLink href="/projects/new">
            <Plus className="h-4 w-4" />
            Nuevo proyecto
          </ButtonLink>
        }
      />

      {error ? (
        <p role="alert" className="text-sm text-danger">
          No se pudieron cargar los proyectos: {error.message}
        </p>
      ) : total === 0 && !hasFilters ? (
        <EmptyState
          icon={FolderGit2}
          title="Aún no hay proyectos"
          description="Documenta tu primer proyecto del portfolio."
          action={<ButtonLink href="/projects/new">Crear el primero</ButtonLink>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusFilterTabs />
            <SearchInput
              placeholder="Buscar por título o descripción…"
              ariaLabel="Buscar proyectos"
            />
          </div>

          <TagFilterChips tags={allTags} />

          {projects && projects.length > 0 ? (
            <ProjectList projects={projects} />
          ) : (
            <EmptyState
              icon={Search}
              title="Sin resultados"
              description="Ningún proyecto coincide con el filtro o la búsqueda."
            />
          )}

          <Pagination page={page} pageCount={pageCount} total={total} />
        </div>
      )}
    </div>
  );
}

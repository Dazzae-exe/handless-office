import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { ProjectForm } from '@/components/projects/ProjectForm';

export const metadata: Metadata = { title: 'Editar proyecto' };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ProjectEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectEditPage({ params }: ProjectEditPageProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const { data: project } = await supabase.from(TABLES.projects).select().eq('id', id).maybeSingle();
  if (!project) notFound();

  return <ProjectForm project={project} />;
}

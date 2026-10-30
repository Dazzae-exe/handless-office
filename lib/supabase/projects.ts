import { createClient } from '@/lib/supabase/client';
import type { Project, ProjectInsert, ProjectUpdate } from '@/types/types';

/** Campos del formulario; `user_id` se completa con la sesión al crear. */
export type ProjectFormData = Omit<ProjectInsert, 'user_id'>;

export async function createProject(data: ProjectFormData): Promise<Project> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Debes iniciar sesión para crear proyectos.');

  const { data: project, error } = await supabase
    .from('projects')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return project;
}

export async function updateProject(id: string, data: ProjectUpdate): Promise<Project> {
  const supabase = createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return project;
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

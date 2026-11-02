import { createClient } from '@/lib/supabase/client';
import type { Project, ProjectFormData, ProjectUpdate } from '@/types/project';

export async function createProject(data: ProjectFormData): Promise<Project> {
  const supabase = createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .insert(data)
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

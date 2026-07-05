'use client';

import { useCallback } from 'react';
import { useMutationRunner } from '@/lib/hooks/useMutationRunner';
import { createProject, deleteProject, updateProject } from '@/lib/supabase/projects';
import type { ProjectFormData } from '@/lib/supabase/projects';
import type { Project, ProjectUpdate } from '@/lib/types';

/**
 * Mutaciones del CRUD de proyectos para componentes cliente. Espejo de
 * usePosts: los listados se cargan en RSC y el runner los revalida tras cada
 * mutación con router.refresh().
 */
export function useProjects() {
  const { run, pending, error } = useMutationRunner();

  const create = useCallback(
    (data: ProjectFormData): Promise<Project | null> => run(() => createProject(data)),
    [run]
  );

  const update = useCallback(
    (id: string, data: ProjectUpdate): Promise<Project | null> =>
      run(() => updateProject(id, data)),
    [run]
  );

  const remove = useCallback(
    (id: string): Promise<boolean | null> => run(() => deleteProject(id).then(() => true)),
    [run]
  );

  return { create, update, remove, pending, error };
}

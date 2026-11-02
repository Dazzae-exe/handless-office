'use client';

import { useCallback } from 'react';
import { useMutationRunner } from '@/hooks/useMutationRunner';
import { createProject, deleteProject, updateProject } from '@/lib/supabase/projects';
import type { Project, ProjectFormData, ProjectUpdate } from '@/types/project';

export function useProjects() {
  const { run, pending, error } = useMutationRunner();

  const create = useCallback(
    (data: ProjectFormData): Promise<Project | null> => run(() => createProject(data)),
    [run]
  );

  const update = useCallback(
    (id: string, data: ProjectUpdate): Promise<Project | null> => run(() => updateProject(id, data)),
    [run]
  );

  const remove = useCallback(
    (id: string): Promise<boolean | null> => run(() => deleteProject(id).then(() => true)),
    [run]
  );

  return { create, update, remove, pending, error };
}

'use client';

import { useCallback } from 'react';
import { useMutationRunner } from '@/lib/hooks/useMutationRunner';
import { createPost, deletePost, updatePost } from '@/lib/supabase/posts';
import type { PostFormData } from '@/lib/supabase/posts';
import type { Post, PostUpdate } from '@/lib/types';

/**
 * Mutaciones del CRUD de posts para componentes cliente. Los listados se
 * cargan en el servidor (RSC); tras cada mutación el runner revalida esos
 * Server Components con router.refresh().
 */
export function usePosts() {
  const { run, pending, error } = useMutationRunner();

  const create = useCallback(
    (data: PostFormData): Promise<Post | null> => run(() => createPost(data)),
    [run]
  );

  const update = useCallback(
    (id: string, data: PostUpdate): Promise<Post | null> => run(() => updatePost(id, data)),
    [run]
  );

  const remove = useCallback(
    (id: string): Promise<boolean | null> => run(() => deletePost(id).then(() => true)),
    [run]
  );

  return { create, update, remove, pending, error };
}

'use client';

import { useCallback } from 'react';
import { useMutationRunner } from '@/hooks/useMutationRunner';
import { createPost, deletePost, updatePost } from '@/lib/supabase/posts';
import type { Post, PostFormData, PostUpdate } from '@/types/post';

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

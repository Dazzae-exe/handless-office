import { createClient } from '@/lib/supabase/client';
import { TABLES } from '@/lib/supabase/tables';
import type { Post, PostFormData, PostUpdate } from '@/types/post';

function friendlyError(error: { code?: string; message: string }): Error {
  if (error.code === '23505') {
    return new Error('Ya existe un post con ese slug. Elige otro en Ajustes.');
  }
  return new Error(error.message);
}

export async function createPost(data: PostFormData): Promise<Post> {
  const supabase = createClient();

  const { data: post, error } = await supabase
    .from(TABLES.posts)
    .insert(data)
    .select()
    .single();
  if (error) throw friendlyError(error);
  return post;
}

export async function updatePost(id: string, data: PostUpdate): Promise<Post> {
  const supabase = createClient();

  const { data: post, error } = await supabase
    .from(TABLES.posts)
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw friendlyError(error);
  return post;
}

export async function deletePost(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from(TABLES.posts).delete().eq('id', id);
  if (error) throw friendlyError(error);
}

import { createClient } from '@/lib/supabase/client';
import type { Post, PostInsert, PostUpdate } from '@/types/types';

/** Campos del formulario; `user_id` se completa con la sesión al crear. */
export type PostFormData = Omit<PostInsert, 'user_id'>;

/** Traduce errores de Postgres a mensajes accionables para el usuario. */
function friendlyError(error: { code?: string; message: string }): Error {
  if (error.code === '23505') {
    return new Error('Ya existe un post con ese slug. Elige otro en Ajustes.');
  }
  return new Error(error.message);
}

export async function createPost(data: PostFormData): Promise<Post> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Debes iniciar sesión para crear posts.');

  const { data: post, error } = await supabase
    .from('posts')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();
  if (error) throw friendlyError(error);
  return post;
}

export async function updatePost(id: string, data: PostUpdate): Promise<Post> {
  const supabase = createClient();

  const { data: post, error } = await supabase
    .from('posts')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw friendlyError(error);
  return post;
}

export async function deletePost(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw friendlyError(error);
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PostForm } from '@/components/posts/PostForm';

export const metadata: Metadata = { title: 'Editar post' };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PostEditPageProps {
  params: Promise<{ id: string }>;
}

/** Página de edición: carga el post en el servidor y monta el formulario. */
export default async function PostEditPage({ params }: PostEditPageProps) {
  const { id } = await params;
  // Evita un error de Postgres (uuid inválido) con ids arbitrarios en la URL.
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const { data: post } = await supabase.from('posts').select().eq('id', id).maybeSingle();
  if (!post) notFound();

  return <PostForm post={post} />;
}

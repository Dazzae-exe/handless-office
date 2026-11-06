import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { PostForm } from '@/components/posts/PostForm';

export const metadata: Metadata = { title: 'Editar post' };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PostEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostEditPage({ params }: PostEditPageProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const { data: post } = await supabase.from(TABLES.posts).select().eq('id', id).maybeSingle();
  if (!post) notFound();

  return <PostForm post={post} />;
}

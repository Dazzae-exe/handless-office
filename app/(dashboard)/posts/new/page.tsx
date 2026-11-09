import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import { PostForm } from '@/components/posts/PostForm';

export const metadata: Metadata = { title: 'Nuevo post' };

export default async function NewPostPage() {
  const supabase = await createClient();
  const { data: types } = await supabase.from(TABLES.posts).select('type');
  const typeOptions = [...new Set((types ?? []).map((row) => row.type))];

  return <PostForm typeOptions={typeOptions} />;
}

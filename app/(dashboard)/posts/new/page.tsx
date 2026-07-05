import type { Metadata } from 'next';
import { PostForm } from '@/components/posts/PostForm';

export const metadata: Metadata = { title: 'Nuevo post' };

/** Página de creación: monta el formulario Notion-style vacío. */
export default function NewPostPage() {
  return <PostForm />;
}

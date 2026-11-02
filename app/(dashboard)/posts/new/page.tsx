import type { Metadata } from 'next';
import { PostForm } from '@/components/posts/PostForm';

export const metadata: Metadata = { title: 'Nuevo post' };

export default function NewPostPage() {
  return <PostForm />;
}

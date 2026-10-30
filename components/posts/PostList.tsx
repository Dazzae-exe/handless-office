import { PostCard } from '@/components/posts/PostCard';
import type { Post } from '@/types/types';

interface PostListProps {
  posts: Post[];
}

/**
 * Lista presentacional de posts. El filtrado, la búsqueda y la paginación se
 * resuelven en el servidor a partir de la URL (ver app/(dashboard)/posts).
 */
export function PostList({ posts }: PostListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </ul>
  );
}

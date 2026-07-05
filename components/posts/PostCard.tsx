import Link from 'next/link';
import Image from 'next/image';
import { FileText, Star } from 'lucide-react';
import type { Post } from '@/lib/types';

// Formato determinista (locale y zona fijas) para que SSR e hidratación coincidan.
const dateFormatter = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

interface PostCardProps {
  post: Post;
}

/**
 * Fila-tarjeta de un post en el listado. Una sola superficie que enlaza a la
 * página de edición; el estado se muestra como badge, sin acciones anidadas.
 */
export function PostCard({ post }: PostCardProps) {
  return (
    <li>
      <Link
        href={`/posts/${post.id}`}
        className="flex items-center gap-4 rounded-card border border-border bg-surface p-4 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt=""
            width={80}
            height={56}
            className="h-14 w-20 shrink-0 rounded-[8px] border border-border object-cover"
          />
        ) : (
          <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-[8px] border border-border bg-surface-hover">
            <FileText className="h-5 w-5 text-muted" strokeWidth={1.5} />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-medium text-foreground">{post.title}</h3>
            {post.featured && (
              <Star
                className="h-3.5 w-3.5 shrink-0 fill-accent text-accent"
                aria-label="Destacado"
              />
            )}
          </div>
          {post.excerpt && <p className="truncate text-sm text-muted">{post.excerpt}</p>}
          <p className="text-xs text-muted">{dateFormatter.format(new Date(post.created_at))}</p>
        </div>

        <span
          className={`shrink-0 rounded-card border px-2.5 py-0.5 text-xs font-medium ${
            post.published
              ? 'border-accent/30 bg-accent/10 text-accent'
              : 'border-border bg-surface-hover text-muted'
          }`}
        >
          {post.published ? 'Publicado' : 'Borrador'}
        </span>
      </Link>
    </li>
  );
}

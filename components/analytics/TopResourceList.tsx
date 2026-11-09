import Link from 'next/link';
import type { TopResource } from '@/types/analytics';

interface TopResourceListProps {
  title: string;
  items: TopResource[];
  emptyText: string;
}

export function TopResourceList({ title, items, emptyText }: TopResourceListProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-6">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{emptyText}</p>
      ) : (
        <ol className="mt-3 divide-y divide-border">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="w-4 shrink-0 tabular-nums text-xs text-muted">{index + 1}</span>
              <Link
                href={`/posts/${item.id}`}
                className="min-w-0 flex-1 truncate text-foreground hover:text-accent"
              >
                {item.title}
              </Link>
              <span className="shrink-0 tabular-nums text-foreground">
                {item.views.toLocaleString('es')}
              </span>
              <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted">
                {item.unique_visitors.toLocaleString('es')} únicos
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

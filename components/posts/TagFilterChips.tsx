'use client';

import { useListFilters } from '@/hooks/useListFilters';

interface TagFilterChipsProps {
  tags: string[];
}

export function TagFilterChips({ tags }: TagFilterChipsProps) {
  const { searchParams, setFilters } = useListFilters();
  const activeTag = searchParams.get('tag');

  if (tags.length === 0) return null;

  return (
    <div role="group" className="flex flex-wrap items-center gap-1.5" aria-label="Filtrar por tag">
      {tags.map((tag) => {
        const active = activeTag === tag;
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={active}
            onClick={() => setFilters({ tag: active ? null : tag })}
            className={`rounded-card border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              active
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-border bg-surface text-muted hover:bg-surface-hover hover:text-foreground'
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}

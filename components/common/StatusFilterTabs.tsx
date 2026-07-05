'use client';

import { useListFilters } from '@/lib/hooks/useListFilters';
import type { StatusFilter } from '@/lib/list-params';

const OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'published', label: 'Publicados' },
  { value: 'draft', label: 'Borradores' },
];

/** Control segmentado Todos/Publicados/Borradores que escribe `?status=` . */
export function StatusFilterTabs() {
  const { searchParams, setFilters } = useListFilters();
  const current = (searchParams.get('status') as StatusFilter | null) ?? 'all';

  return (
    <div
      role="radiogroup"
      aria-label="Filtrar por estado"
      className="inline-flex items-center gap-0.5 rounded-card border border-border bg-surface p-0.5"
    >
      {OPTIONS.map(({ value, label }) => {
        const active = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setFilters({ status: value === 'all' ? null : value })}
            className={`h-8 rounded-[8px] px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted hover:bg-surface-hover hover:text-foreground'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

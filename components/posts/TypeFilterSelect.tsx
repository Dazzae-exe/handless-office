'use client';

import { useListFilters } from '@/hooks/useListFilters';

interface TypeFilterSelectProps {
  types: string[];
}

export function TypeFilterSelect({ types }: TypeFilterSelectProps) {
  const { searchParams, setFilters } = useListFilters();
  const activeType = searchParams.get('type') ?? '';
  const options = activeType && !types.includes(activeType) ? [...types, activeType] : types;

  if (options.length === 0) return null;

  return (
    <select
      aria-label="Filtrar por tipo"
      value={activeType}
      onChange={(e) => setFilters({ type: e.target.value || null })}
      className="h-10 rounded-card border border-border bg-input px-3 text-sm text-foreground transition-colors focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <option value="">Todos los tipos</option>
      {options.map((type) => (
        <option key={type} value={type}>
          {type}
        </option>
      ))}
    </select>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useListFilters } from '@/lib/hooks/useListFilters';

const DEBOUNCE_MS = 300;

interface SearchInputProps {
  placeholder?: string;
  ariaLabel: string;
}

/** Búsqueda con debounce que escribe `?q=` (la consulta corre en el servidor). */
export function SearchInput({ placeholder = 'Buscar…', ariaLabel }: SearchInputProps) {
  const { searchParams, setFilters, isPending } = useListFilters();
  const [value, setValue] = useState(searchParams.get('q') ?? '');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpia el debounce colgado al desmontar (navegación).
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const onChange = (next: string) => {
    setValue(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setFilters({ q: next.trim() || null });
    }, DEBOUNCE_MS);
  };

  return (
    <div className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-10 w-full rounded-card border border-border bg-input pl-9 pr-9 text-sm text-foreground placeholder:text-muted transition-colors focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      />
      {isPending && (
        <Loader2
          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted"
          aria-label="Buscando…"
        />
      )}
    </div>
  );
}

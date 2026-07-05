'use client';

import { useCallback, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Lee y escribe el estado del listado en la URL (status, q, tag, page). Las
 * actualizaciones usan router.replace dentro de una transición para poder
 * mostrar estado pendiente mientras el RSC re-consulta en el servidor.
 */
export function useListFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  /** Construye un href con los params actuales más los overrides (null borra). */
  const buildHref = useCallback(
    (overrides: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(overrides)) {
        if (value === null || value === '') params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams]
  );

  /** Aplica filtros; cambiar un filtro siempre vuelve a la página 1. */
  const setFilters = useCallback(
    (overrides: Record<string, string | null>) => {
      startTransition(() => {
        router.replace(buildHref({ page: null, ...overrides }), { scroll: false });
      });
    },
    [router, buildHref]
  );

  return { searchParams, buildHref, setFilters, isPending };
}

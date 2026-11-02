'use client';

import { useCallback, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// router.replace va en una transición para exponer isPending mientras el RSC re-consulta en el servidor.
export function useListFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

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

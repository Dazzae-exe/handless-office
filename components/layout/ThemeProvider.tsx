'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import type { ResolvedTheme } from '@/types/theme';
import { applyClass, getResolvedSnapshot, subscribe } from '@/lib/theme/store';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    getResolvedSnapshot,
    () => 'light' as ResolvedTheme
  );

  // Efecto válido: sincroniza el DOM externo sin setState, así que no dispara renders en cascada.
  useEffect(() => {
    applyClass(resolvedTheme);
  }, [resolvedTheme]);

  return <>{children}</>;
}

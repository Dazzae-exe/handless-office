'use client';

import { useSyncExternalStore } from 'react';
import type { ResolvedTheme, Theme, UseThemeResult } from '@/types/theme';
import {
  getResolvedSnapshot,
  getThemeSnapshot,
  setTheme,
  subscribe,
} from '@/lib/theme/store';

export function useTheme(): UseThemeResult {
  const theme = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    () => 'system' as Theme
  );
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    getResolvedSnapshot,
    () => 'light' as ResolvedTheme
  );

  return { theme, resolvedTheme, setTheme };
}

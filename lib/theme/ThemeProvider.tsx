'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import {
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type Theme,
} from './theme-script';

const DARK_QUERY = '(prefers-color-scheme: dark)';
/** Evento propio para notificar cambios de tema en la misma pestaña. */
const THEME_EVENT = 'themechange';

/** Resuelve la preferencia a un tema concreto según el sistema. */
function resolve(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
  }
  return theme;
}

/** Aplica la clase concreta en <html> (igual que el script anti-flash). */
function applyClass(resolved: ResolvedTheme) {
  const list = document.documentElement.classList;
  list.remove('light', 'dark');
  list.add(resolved);
}

// ─── Store externo (localStorage + matchMedia) para useSyncExternalStore ─────
// Evita setState en efectos y resuelve la hidratación de forma segura: el
// servidor y el primer render del cliente usan el snapshot del servidor, y React
// vuelve a renderizar con el valor real tras hidratar.

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  window.addEventListener(THEME_EVENT, callback);
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener('change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(THEME_EVENT, callback);
    media.removeEventListener('change', callback);
  };
}

function getThemeSnapshot(): Theme {
  const t = localStorage.getItem(THEME_STORAGE_KEY);
  return t === 'light' || t === 'dark' || t === 'system' ? t : 'system';
}

function getResolvedSnapshot(): ResolvedTheme {
  return resolve(getThemeSnapshot());
}

/**
 * Monta el sincronizador que mantiene la clase de <html> alineada con el tema
 * efectivo (incluye cambios de la preferencia del sistema en modo `system`).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    getResolvedSnapshot,
    () => 'light' as ResolvedTheme
  );

  // Sincroniza un sistema externo (el DOM) con el estado de React: uso válido de
  // efecto y sin setState, así que no dispara renders en cascada.
  useEffect(() => {
    applyClass(resolvedTheme);
  }, [resolvedTheme]);

  return <>{children}</>;
}

export interface UseThemeResult {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

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

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyClass(resolve(next));
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  return { theme, resolvedTheme, setTheme };
}

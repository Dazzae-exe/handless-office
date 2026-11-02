import type { ResolvedTheme, Theme } from '@/types/theme';
import { THEME_STORAGE_KEY } from '@/utils/theme/theme-script';

const DARK_QUERY = '(prefers-color-scheme: dark)';
const THEME_EVENT = 'themechange';

function resolve(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
  }
  return theme;
}

// Debe aplicar la misma clase en <html> que el script anti-flash.
export function applyClass(resolved: ResolvedTheme) {
  const list = document.documentElement.classList;
  list.remove('light', 'dark');
  list.add(resolved);
}

// Store externo para useSyncExternalStore: servidor y primer render usan el snapshot del servidor, sin mismatch de hidratación.
export function subscribe(callback: () => void): () => void {
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

export function getThemeSnapshot(): Theme {
  const t = localStorage.getItem(THEME_STORAGE_KEY);
  return t === 'light' || t === 'dark' || t === 'system' ? t : 'system';
}

export function getResolvedSnapshot(): ResolvedTheme {
  return resolve(getThemeSnapshot());
}

export function setTheme(next: Theme) {
  localStorage.setItem(THEME_STORAGE_KEY, next);
  applyClass(resolve(next));
  window.dispatchEvent(new Event(THEME_EVENT));
}

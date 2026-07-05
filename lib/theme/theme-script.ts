/**
 * Constantes del tema compartidas entre el script anti-flash (inyectado en el
 * <head> antes de la hidratación) y el ThemeProvider del cliente.
 */

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

/**
 * Script que corre ANTES del primer paint para evitar el parpadeo (FOUC) del
 * tema. Lee la preferencia guardada, la resuelve a una clase concreta
 * (`light`/`dark`) y la aplica en <html>. Aplicar siempre una clase concreta
 * es necesario para que las utilidades `dark:` de Tailwind funcionen incluso en
 * modo "system". Debe mantenerse minificado y sin dependencias.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var c=document.documentElement.classList;c.remove('light','dark');c.add(d?'dark':'light');}catch(e){}})();`;

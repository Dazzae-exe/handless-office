'use client';

import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { PanelLeft, PanelLeftClose, X } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { SidebarContent } from './Sidebar';

const PINNED_STORAGE_KEY = 'sidebar-pinned';
// Evento propio: `storage` no se dispara en la misma pestaña que escribe.
const PINNED_EVENT = 'sidebarpinnedchange';
// Retardo para no cerrar el panel flotante al cruzar huecos con el puntero.
const CLOSE_DELAY_MS = 150;

// Store externo en localStorage: evita setState en efectos y resuelve la hidratación de forma segura.
function subscribePinned(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  window.addEventListener(PINNED_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(PINNED_EVENT, callback);
  };
}

function getPinnedSnapshot(): boolean {
  return localStorage.getItem(PINNED_STORAGE_KEY) !== 'false';
}

const controlButton =
  'inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pinned = useSyncExternalStore(
    subscribePinned,
    getPinnedSnapshot,
    () => true
  );
  const [hovering, setHovering] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const togglePin = useCallback(() => {
    localStorage.setItem(PINNED_STORAGE_KEY, String(!getPinnedSnapshot()));
    window.dispatchEvent(new Event(PINNED_EVENT));
    setHovering(false);
  }, []);

  const openFloat = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHovering(true);
  }, []);

  const closeFloat = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setHovering(false), CLOSE_DELAY_MS);
  }, []);

  // Estable a propósito: un ref callback nuevo por render ejecutaría la limpieza y cancelaría el cierre diferido.
  const clearTimerOnUnmount = useCallback(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const collapseControl = (
    <button
      type="button"
      onClick={togglePin}
      aria-label={pinned ? 'Colapsar barra lateral' : 'Fijar barra lateral'}
      aria-pressed={pinned}
      title={pinned ? 'Colapsar barra lateral' : 'Fijar barra lateral'}
      className={`${controlButton} hidden md:inline-flex`}
    >
      {pinned ? (
        <PanelLeftClose className="h-4 w-4" />
      ) : (
        <PanelLeft className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <div ref={clearTimerOnUnmount} className="flex min-h-dvh bg-background">
      {pinned && (
        <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:block">
          <SidebarContent control={collapseControl} />
        </aside>
      )}

      {!pinned && (
        <div
          aria-hidden
          onMouseEnter={openFloat}
          onMouseLeave={closeFloat}
          className="fixed left-0 top-0 z-30 hidden h-full w-4 md:block"
        />
      )}

      {!pinned && (
        <aside
          onMouseEnter={openFloat}
          onMouseLeave={closeFloat}
          className={`fixed bottom-2 left-2 top-2 z-40 hidden w-64 rounded-card border border-border bg-surface shadow-xl transition-all duration-200 md:block ${
            hovering
              ? 'translate-x-0 opacity-100'
              : 'pointer-events-none -translate-x-[112%] opacity-0'
          }`}
        >
          <SidebarContent control={collapseControl} />
        </aside>
      )}

      {mobileOpen && (
        <div
          aria-hidden
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}
      <aside
        className={`fixed bottom-0 left-0 top-0 z-50 w-64 border-r border-border bg-surface transition-transform duration-200 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent
          onNavigate={() => setMobileOpen(false)}
          control={
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar navegación"
              className={controlButton}
            >
              <X className="h-4 w-4" />
            </button>
          }
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

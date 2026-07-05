'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  BarChart3,
  FileText,
  FolderGit2,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { signout } from '@/app/(auth)/actions';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Navegación principal del dashboard. */
const NAV: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/posts', label: 'Posts', icon: FileText },
  { href: '/projects', label: 'Proyectos', icon: FolderGit2 },
  { href: '/analytics', label: 'Analíticas', icon: BarChart3 },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

interface SidebarContentProps {
  email: string;
  /** Se dispara al navegar (para cerrar el drawer móvil). */
  onNavigate?: () => void;
  /** Control superior derecho (colapsar en escritorio / cerrar en móvil). */
  control?: ReactNode;
}

/**
 * Contenido interno de la barra lateral, reutilizado por las tres variantes de
 * posición del AppShell (fija, flotante y drawer móvil). Una sola superficie:
 * marca arriba, navegación en medio, usuario abajo.
 */
export function SidebarContent({
  email,
  onNavigate,
  control,
}: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Marca + control */}
      <div className="flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-accent text-sm font-semibold text-accent-foreground">
            B
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Blog Dashboard
          </span>
        </Link>
        {control}
      </div>

      {/* Navegación */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? 'bg-surface-hover font-medium text-foreground'
                  : 'text-muted hover:bg-surface-hover hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Usuario + logout */}
      <div className="flex items-center gap-2 border-t border-border px-3 py-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-medium text-foreground" title={email}>
            {email || 'Usuario'}
          </span>
          <span className="text-[11px] text-muted">Conectado</span>
        </div>
        <form action={signout}>
          <button
            type="submit"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-muted transition-colors hover:bg-surface-hover hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

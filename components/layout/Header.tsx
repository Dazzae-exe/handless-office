'use client';

import { Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';

interface HeaderProps {
  onOpenMobile: () => void;
}

const iconButton =
  'inline-flex h-9 w-9 items-center justify-center rounded-[8px] text-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function Header({ onOpenMobile }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <button
        type="button"
        onClick={onOpenMobile}
        aria-label="Abrir navegación"
        className={`${iconButton} md:hidden`}
      >
        <Menu className="h-4.5 w-4.5" />
      </button>

      <div className="flex-1" />

      <ThemeToggle />
    </header>
  );
}

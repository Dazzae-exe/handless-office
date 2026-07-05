'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeProvider';
import type { Theme } from '@/lib/theme/theme-script';

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Tema claro', icon: Sun },
  { value: 'dark', label: 'Tema oscuro', icon: Moon },
  { value: 'system', label: 'Tema del sistema', icon: Monitor },
];

/**
 * Control segmentado de 3 estados (claro/oscuro/sistema). Minimalista, borde de
 * 1px y radio de 11px como el resto del sistema de diseño.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className="inline-flex items-center gap-0.5 rounded-card border border-border bg-surface p-0.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-[8px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted hover:bg-surface-hover hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}

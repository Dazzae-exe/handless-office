'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  /** Acciones del pie (p. ej. botones Cancelar / Confirmar). */
  footer?: ReactNode;
}

/**
 * Modal accesible construido sobre el elemento nativo <dialog>, que aporta
 * gratis el focus-trap, el cierre con Escape y la capa de fondo (::backdrop).
 * Minimalista: una sola superficie, sin tarjetas anidadas.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  // Sincroniza la prop `open` con los métodos imperativos del <dialog>.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      // `onClose` del <dialog> cubre Escape y el cierre nativo.
      onClose={onClose}
      // Cierra al hacer clic en el backdrop (fuera del contenido interno).
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-full max-w-md rounded-card border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-black/50 backdrop:backdrop-blur-sm open:animate-none"
    >
      <div className="flex flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {title && (
              <h2 className="text-base font-semibold text-foreground">
                {title}
              </h2>
            )}
            {description && <p className="text-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children && <div className="text-sm text-foreground">{children}</div>}

        {footer && <div className="flex justify-end gap-2">{footer}</div>}
      </div>
    </dialog>
  );
}

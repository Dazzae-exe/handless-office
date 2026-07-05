'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useListFilters } from '@/lib/hooks/useListFilters';

interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
}

/** Ventana compacta de páginas: 1 … (actual±1) … última. */
function pageItems(current: number, count: number): (number | '…')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);

  const pages = [...new Set([1, current - 1, current, current + 1, count])]
    .filter((p) => p >= 1 && p <= count)
    .sort((a, b) => a - b);

  const items: (number | '…')[] = [];
  for (let i = 0; i < pages.length; i++) {
    if (i > 0 && pages[i] - pages[i - 1] > 1) items.push('…');
    items.push(pages[i]);
  }
  return items;
}

/** Pie del listado: contador de resultados + navegación numerada por URL. */
export function Pagination({ page, pageCount, total }: PaginationProps) {
  const { buildHref } = useListFilters();

  const hrefFor = (p: number) => buildHref({ page: p <= 1 ? null : String(p) });

  const navButton =
    'inline-flex h-8 items-center gap-1 rounded-[8px] px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">
        {total} {total === 1 ? 'resultado' : 'resultados'}
      </p>

      {pageCount > 1 && (
        <nav aria-label="Paginación" className="flex items-center gap-1">
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} className={`${navButton} text-muted hover:bg-surface-hover hover:text-foreground`}>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Link>
          ) : (
            <span aria-disabled className={`${navButton} cursor-not-allowed text-muted/50`}>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </span>
          )}

          {pageItems(page, pageCount).map((item, i) =>
            item === '…' ? (
              <span key={`gap-${i}`} className="px-1.5 text-sm text-muted">
                …
              </span>
            ) : (
              <Link
                key={item}
                href={hrefFor(item)}
                aria-current={item === page ? 'page' : undefined}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  item === page
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted hover:bg-surface-hover hover:text-foreground'
                }`}
              >
                {item}
              </Link>
            )
          )}

          {page < pageCount ? (
            <Link href={hrefFor(page + 1)} className={`${navButton} text-muted hover:bg-surface-hover hover:text-foreground`}>
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span aria-disabled className={`${navButton} cursor-not-allowed text-muted/50`}>
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}

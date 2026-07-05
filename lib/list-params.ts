/**
 * Estado de los listados (filtros, búsqueda, paginación) codificado en la URL
 * (?status=draft&q=…&tag=…&page=2) y resuelto en el servidor con Supabase.
 */

export const POSTS_PAGE_SIZE = 10;
export const PROJECTS_PAGE_SIZE = 9;

export type StatusFilter = 'all' | 'published' | 'draft';

export interface ListParams {
  status: StatusFilter;
  /** Término de búsqueda ya saneado para interpolarse en un patrón ilike. */
  q: string;
  page: number;
  tag: string | null;
}

/**
 * Sanea el término para el `or(ilike)` de PostgREST: quita comodines de LIKE
 * (%, _) y caracteres que rompen la sintaxis del filtro (comillas, backslash).
 */
export function sanitizeSearch(raw: string): string {
  return raw.replace(/[%_"\\]/g, '').trim().slice(0, 100);
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseListParams(sp: RawSearchParams): ListParams {
  const statusRaw = first(sp.status);
  const status: StatusFilter =
    statusRaw === 'published' || statusRaw === 'draft' ? statusRaw : 'all';

  const q = sanitizeSearch(first(sp.q) ?? '');

  const pageRaw = Number.parseInt(first(sp.page) ?? '1', 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const tag = first(sp.tag)?.trim() || null;

  return { status, q, page, tag };
}

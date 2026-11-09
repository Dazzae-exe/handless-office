import type { ListParams, StatusFilter } from '@/types/list-params';
import { normalizeTag } from '@/utils/validators/post';

export const POSTS_PAGE_SIZE = 10;

// Para el or(ilike) de PostgREST: quita comodines LIKE (%, _) y caracteres que rompen el filtro.
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

  const tag = normalizeTag(first(sp.tag) ?? '') || null;
  const type = first(sp.type)?.trim() || null;

  return { status, q, page, tag, type };
}

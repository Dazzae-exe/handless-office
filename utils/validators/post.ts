import { isEmptyHtml } from '@/utils/validators/html';

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    // Elimina las marcas diacríticas separadas por NFD (acentos, diéresis…).
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function validatePostTitle(title: string): string | null {
  if (!title.trim()) return 'El título es obligatorio.';
  return null;
}

export function validatePostType(type: string): string | null {
  if (!type.trim()) return 'El tipo es obligatorio.';
  return null;
}

export function validatePostContent(html: string): string | null {
  if (isEmptyHtml(html)) return 'El contenido no puede estar vacío.';
  return null;
}

export function validateOptionalUrl(value: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return 'La URL debe empezar con http:// o https://';
    }
    return null;
  } catch {
    return 'Ingresa una URL válida (https://…).';
  }
}

export function normalizeTag(tag: string): string {
  // postgrest-js arma cs.{a,b} sin escapar: estos caracteres romperían o inyectarían el filtro.
  return tag.replace(/[,{}"\\]/g, '').trim().replace(/\s+/g, ' ');
}

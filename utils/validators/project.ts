/** Validaciones y utilidades compartidas para el formulario de proyectos. */

import { isEmptyHtml } from '@/utils/validators/html';

export function validateProjectTitle(title: string): string | null {
  if (!title.trim()) return 'El título es obligatorio.';
  return null;
}

export function validateProjectContent(html: string): string | null {
  if (isEmptyHtml(html)) return 'El contenido no puede estar vacío.';
  return null;
}

/** Valida una URL opcional: vacía es válida; si hay valor debe ser http(s). */
export function validateOptionalUrl(value: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return 'La URL debe empezar con https://';
    }
    return null;
  } catch {
    return 'Ingresa una URL válida (https://…).';
  }
}

/** Normaliza un tag: recorta espacios y colapsa los internos. */
export function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, ' ');
}

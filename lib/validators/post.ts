/** Validaciones y utilidades compartidas para el formulario de posts. */

import { isEmptyHtml } from '@/lib/validators/html';

/** Convierte un título en un slug URL-safe: minúsculas, sin acentos, guiones. */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    // Elimina las marcas diacríticas separadas por NFD (acentos, diéresis…).
    .replace(/[\u0300-\u036f]/g, '')
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

export function validatePostContent(html: string): string | null {
  if (isEmptyHtml(html)) return 'El contenido no puede estar vacío.';
  return null;
}

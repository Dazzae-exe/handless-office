import { createClient } from '@/lib/supabase/client';

/** Bucket público donde vive el contenido de imágenes del editor Tiptap. */
export const EDITOR_IMAGE_BUCKET = 'tiptap_content';

/**
 * Carpetas de nivel superior dentro del bucket: una para blogs (posts) y otra
 * para proyectos. La RLS solo permite subir dentro de estas carpetas y en la
 * subcarpeta del propio usuario (`<tipo>/<uid>/…`).
 */
export type EditorContentType = 'posts' | 'projects';

/** Debe coincidir con el `file_size_limit` del bucket en Supabase (5 MB). */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** Debe coincidir con `allowed_mime_types` del bucket en Supabase. */
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
] as const;

export interface UploadedImage {
  url: string;
  path: string;
}

/** Valida un archivo contra los límites del bucket. Devuelve el error o null. */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return 'Formato no admitido. Usa JPG, PNG, WebP, GIF, SVG o AVIF.';
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return 'La imagen supera el límite de 5 MB.';
  }
  return null;
}

function extensionFor(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  return file.type.split('/')[1] ?? 'bin';
}

/**
 * Sube una imagen al Storage de Supabase dentro de la carpeta del tipo de
 * contenido y del usuario (`<tipo>/<uid>/<uuid>.<ext>`), tal como exige la RLS
 * del bucket, y registra su metadata en la tabla `images`. Devuelve la URL
 * pública para insertarla en el editor.
 *
 * Lanza si el usuario no está autenticado, si el archivo no valida, o si
 * Storage rechaza la subida.
 */
export async function uploadEditorImage(
  file: File,
  contentType: EditorContentType
): Promise<UploadedImage> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Debes iniciar sesión para subir imágenes.');
  }

  const path = `${contentType}/${user.id}/${crypto.randomUUID()}.${extensionFor(file)}`;

  const { error: uploadError } = await supabase.storage
    .from(EDITOR_IMAGE_BUCKET)
    .upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: false });
  if (uploadError) {
    throw new Error(`No se pudo subir la imagen: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(EDITOR_IMAGE_BUCKET).getPublicUrl(path);

  // Registro de metadata (best-effort): no bloquea la inserción en el editor.
  await supabase.from('images').insert({
    user_id: user.id,
    file_path: path,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
    alt_text: null,
  });

  return { url: publicUrl, path };
}

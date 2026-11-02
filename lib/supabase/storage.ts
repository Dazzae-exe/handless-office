import { createClient } from '@/lib/supabase/client';
import type { EditorContentType } from '@/types/editor';
import type { UploadedImage } from '@/types/image';

export const EDITOR_IMAGE_BUCKET = 'tiptap_content';

// Debe coincidir con el `file_size_limit` del bucket en Supabase (5 MB).
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// Debe coincidir con `allowed_mime_types` del bucket en Supabase.
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
] as const;

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

export async function uploadEditorImage(
  file: File,
  contentType: EditorContentType
): Promise<UploadedImage> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();

  const path = `${contentType}/${crypto.randomUUID()}.${extensionFor(file)}`;

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
    file_path: path,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
    alt_text: null,
  });

  return { url: publicUrl, path };
}

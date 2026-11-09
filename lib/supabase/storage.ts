import { createClient } from '@/lib/supabase/client';
import { TABLES } from '@/lib/supabase/tables';
import type { UploadedImage } from '@/types/image';

export const EDITOR_IMAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'tiptap_content';

export const MAX_IMAGE_SIZE = 1 * 1024 * 1024;

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
    return 'La imagen supera el límite de 1 MB.';
  }
  return null;
}

function extensionFor(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  return file.type.split('/')[1] ?? 'bin';
}

export async function uploadEditorImage(file: File): Promise<UploadedImage> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();

  const path = `posts/${crypto.randomUUID()}.${extensionFor(file)}`;

  const { error: uploadError } = await supabase.storage
    .from(EDITOR_IMAGE_BUCKET)
    .upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: false });
  if (uploadError) {
    throw new Error(`No se pudo subir la imagen: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(EDITOR_IMAGE_BUCKET).getPublicUrl(path);

  // El query builder de Supabase es lazy: sin `.then()` la petición no se envía.
  void supabase
    .from(TABLES.images)
    .insert({
      file_path: path,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      alt_text: null,
    })
    .then(({ error }) => {
      if (error) console.warn(`No se pudo registrar la imagen ${path}: ${error.message}`);
    });

  return { url: publicUrl, path };
}

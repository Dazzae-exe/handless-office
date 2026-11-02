export type Image = {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  alt_text: string | null;
  uploaded_at: string;
}

export type ImageInsert = Omit<Image, 'id' | 'user_id' | 'uploaded_at'>;

export interface UploadedImage {
  url: string;
  path: string;
}

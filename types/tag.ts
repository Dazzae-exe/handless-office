export type Tag = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  created_at: string;
}

export type TagInsert = Omit<Tag, 'id' | 'created_at'>;

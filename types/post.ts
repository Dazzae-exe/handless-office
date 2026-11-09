export type Post = {
  id: string;
  type: string;
  title: string;
  content: string;
  description: string | null;
  slug: string | null;
  cover_image: string | null;
  tags: string[];
  github_url: string | null;
  website_url: string | null;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export type PostInsert = Omit<Post, 'id' | 'created_at' | 'updated_at'>;
export type PostUpdate = Partial<Omit<Post, 'id' | 'created_at' | 'updated_at'>>;

export type PostFormData = PostInsert;

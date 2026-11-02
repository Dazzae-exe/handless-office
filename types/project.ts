export type Project = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  content: string;
  cover_image: string | null;
  github_url: string | null;
  demo_url: string | null;
  tags: string[];
  published: boolean;
  created_at: string;
  updated_at: string;
}

export type ProjectInsert = Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type ProjectUpdate = Partial<Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type ProjectFormData = ProjectInsert;

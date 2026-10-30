// ─── Database schema types ────────────────────────────────────────────────────

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      posts: {
        Row: Post;
        Insert: PostInsert;
        Update: PostUpdate;
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
        Relationships: [];
      };
      tags: {
        Row: Tag;
        Insert: TagInsert;
        Update: Omit<TagInsert, 'user_id'> & { id?: string };
        Relationships: [];
      };
      posts_tags: {
        Row: { post_id: string; tag_id: string };
        Insert: { post_id: string; tag_id: string };
        Update: { post_id?: string; tag_id?: string };
        Relationships: [];
      };
      images: {
        Row: Image;
        Insert: ImageInsert;
        Update: Partial<ImageInsert>;
        Relationships: [];
      };
      analytics: {
        Row: AnalyticsEvent;
        Insert: AnalyticsEventInsert;
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      analytics_daily: { Row: AnalyticsDaily; Relationships: [] };
      analytics_summary: { Row: AnalyticsSummary; Relationships: [] };
      analytics_top_posts: { Row: AnalyticsTopPost; Relationships: [] };
      analytics_top_projects: { Row: AnalyticsTopProject; Relationships: [] };
    };
    Functions: {
      track_view: {
        Args: {
          p_page_path: string;
          p_resource_type?: AnalyticsResourceType;
          p_resource_id?: string | null;
          p_visitor_id?: string | null;
          p_referrer?: string | null;
          p_user_agent?: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

// ─── Domain types ─────────────────────────────────────────────────────────────

export type Post = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  excerpt: string | null;
  slug: string | null;
  cover_image: string | null;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export type PostInsert = Omit<Post, 'id' | 'created_at' | 'updated_at'>;
export type PostUpdate = Partial<Omit<Post, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

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

export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'>;
export type ProjectUpdate = Partial<Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type Tag = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  created_at: string;
}

export type TagInsert = Omit<Tag, 'id' | 'created_at'>;

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

export type ImageInsert = Omit<Image, 'id' | 'uploaded_at'>;

export type AnalyticsResourceType = 'post' | 'project' | 'page';

export type AnalyticsEvent = {
  id: string;
  page_path: string;
  resource_type: AnalyticsResourceType | null;
  resource_id: string | null;
  visitor_id: string | null;
  referrer: string | null;
  user_agent: string | null;
  viewed_at: string;
}

export type AnalyticsEventInsert = Omit<AnalyticsEvent, 'id' | 'viewed_at'>;

// Agregados servidos por las vistas SQL (Fase 7)

export type AnalyticsDaily = {
  day: string;
  resource_type: AnalyticsResourceType;
  views: number;
  unique_visitors: number;
}

export type AnalyticsSummary = {
  total_views: number;
  unique_visitors: number;
  page_views: number;
  post_views: number;
  project_views: number;
}

export type AnalyticsTopPost = {
  id: string;
  title: string;
  slug: string | null;
  views: number;
  unique_visitors: number;
  last_viewed_at: string;
}

export type AnalyticsTopProject = Omit<AnalyticsTopPost, 'slug'>;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  created_at: string;
}

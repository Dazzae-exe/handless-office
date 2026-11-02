import type { Post, PostInsert, PostUpdate } from '@/types/post';
import type { Project, ProjectInsert, ProjectUpdate } from '@/types/project';
import type { Tag, TagInsert } from '@/types/tag';
import type { Image, ImageInsert } from '@/types/image';
import type {
  AnalyticsDaily,
  AnalyticsEvent,
  AnalyticsEventInsert,
  AnalyticsResourceType,
  AnalyticsSummary,
  AnalyticsTopPost,
  AnalyticsTopProject,
} from '@/types/analytics';

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

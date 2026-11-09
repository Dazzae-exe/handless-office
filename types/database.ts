import type { Post, PostInsert, PostUpdate } from '@/types/post';
import type { Image, ImageInsert } from '@/types/image';
import type {
  AnalyticsDaily,
  AnalyticsEvent,
  AnalyticsEventInsert,
  AnalyticsSummary,
  AnalyticsTopPost,
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
      images: {
        Row: Image;
        Insert: ImageInsert;
        Update: Partial<ImageInsert>;
        Relationships: [];
      };
      analytics_events: {
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
    };
    Functions: {
      track_view: {
        Args: {
          p_post_id: string;
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

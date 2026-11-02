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

export interface AnalyticsData {
  summary: AnalyticsSummary;
  daily: AnalyticsDaily[];
  topPosts: AnalyticsTopPost[];
  topProjects: AnalyticsTopProject[];
}

export interface DailyViews {
  day: string; // YYYY-MM-DD
  views: number;
}

export interface TopResource {
  id: string;
  title: string;
  views: number;
  unique_visitors: number;
}

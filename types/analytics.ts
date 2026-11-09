export type AnalyticsEvent = {
  id: string;
  post_id: string;
  visitor_id: string | null;
  referrer: string | null;
  user_agent: string | null;
  viewed_at: string;
}

export type AnalyticsEventInsert = Omit<AnalyticsEvent, 'id' | 'viewed_at'>;

export type AnalyticsDaily = {
  day: string;
  views: number;
  unique_visitors: number;
}

export type AnalyticsSummary = {
  total_views: number;
  unique_visitors: number;
}

export type AnalyticsTopPost = {
  id: string;
  title: string;
  slug: string | null;
  views: number;
  unique_visitors: number;
  last_viewed_at: string;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  daily: AnalyticsDaily[];
  topPosts: AnalyticsTopPost[];
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

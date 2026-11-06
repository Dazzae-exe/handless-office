import { createClient } from '@/lib/supabase/server';
import { VIEWS } from '@/lib/supabase/tables';
import type { AnalyticsData, AnalyticsSummary } from '@/types/analytics';

export const ANALYTICS_RANGE_DAYS = 30;

const EMPTY_SUMMARY: AnalyticsSummary = {
  total_views: 0,
  unique_visitors: 0,
  page_views: 0,
  post_views: 0,
  project_views: 0,
};

export async function getAnalytics(): Promise<AnalyticsData> {
  const supabase = await createClient();

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (ANALYTICS_RANGE_DAYS - 1));
  const sinceDay = since.toISOString().slice(0, 10);

  const [summaryRes, dailyRes, topPostsRes, topProjectsRes] = await Promise.all([
    supabase.from(VIEWS.summary).select('*').maybeSingle(),
    supabase.from(VIEWS.daily).select('*').gte('day', sinceDay).order('day'),
    supabase.from(VIEWS.topPosts).select('*').order('views', { ascending: false }).limit(5),
    supabase
      .from(VIEWS.topProjects)
      .select('*')
      .order('views', { ascending: false })
      .limit(5),
  ]);

  const error =
    summaryRes.error ?? dailyRes.error ?? topPostsRes.error ?? topProjectsRes.error;
  if (error) throw new Error(error.message);

  return {
    summary: summaryRes.data ?? EMPTY_SUMMARY,
    daily: dailyRes.data ?? [],
    topPosts: topPostsRes.data ?? [],
    topProjects: topProjectsRes.data ?? [],
  };
}

export async function getTotalViews(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from(VIEWS.summary).select('total_views').maybeSingle();
  return data?.total_views ?? 0;
}

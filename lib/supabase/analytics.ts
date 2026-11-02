import { createClient } from '@/lib/supabase/server';
import type { AnalyticsData, AnalyticsSummary } from '@/types/analytics';

export const ANALYTICS_RANGE_DAYS = 30;

const EMPTY_SUMMARY: AnalyticsSummary = {
  total_views: 0,
  unique_visitors: 0,
  page_views: 0,
  post_views: 0,
  project_views: 0,
};

// Las vistas usan security_invoker: devuelven lo que la RLS permita al rol que consulta.
export async function getAnalytics(): Promise<AnalyticsData> {
  const supabase = await createClient();

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (ANALYTICS_RANGE_DAYS - 1));
  const sinceDay = since.toISOString().slice(0, 10);

  const [summaryRes, dailyRes, topPostsRes, topProjectsRes] = await Promise.all([
    supabase.from('analytics_summary').select('*').maybeSingle(),
    supabase.from('analytics_daily').select('*').gte('day', sinceDay).order('day'),
    supabase.from('analytics_top_posts').select('*').order('views', { ascending: false }).limit(5),
    supabase
      .from('analytics_top_projects')
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
  const { data } = await supabase.from('analytics_summary').select('total_views').maybeSingle();
  return data?.total_views ?? 0;
}

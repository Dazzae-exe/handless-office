import type { Metadata } from 'next';
import { BarChart3, Eye, FileText, FolderGit2, Users } from 'lucide-react';
import { getAnalytics, ANALYTICS_RANGE_DAYS } from '@/lib/supabase/analytics';
import type { AnalyticsData } from '@/lib/supabase/analytics';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ViewsChart } from '@/components/analytics/ViewsChart';
import type { DailyViews } from '@/components/analytics/ViewsChart';
import { TopResourceList } from '@/components/analytics/TopResourceList';

export const metadata: Metadata = { title: 'Analíticas' };

/** Serie completa de los últimos N días: los días sin visitas cuentan cero. */
function buildDailySeries(daily: AnalyticsData['daily']): DailyViews[] {
  const viewsByDay = new Map<string, number>();
  for (const row of daily) {
    viewsByDay.set(row.day, (viewsByDay.get(row.day) ?? 0) + row.views);
  }

  const series: DailyViews[] = [];
  const cursor = new Date();
  cursor.setUTCDate(cursor.getUTCDate() - (ANALYTICS_RANGE_DAYS - 1));
  for (let i = 0; i < ANALYTICS_RANGE_DAYS; i++) {
    const day = cursor.toISOString().slice(0, 10);
    series.push({ day, views: viewsByDay.get(day) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return series;
}

/** Visitas del sitio público: totales, serie de 30 días y recursos más vistos. */
export default async function AnalyticsPage() {
  let data: AnalyticsData;
  try {
    data = await getAnalytics();
  } catch (error) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <PageHeader title="Analíticas" description="Visitas a tus posts, proyectos y páginas." />
        <p role="alert" className="text-sm text-danger">
          No se pudieron cargar las analíticas:{' '}
          {error instanceof Error ? error.message : 'error desconocido'}
        </p>
      </div>
    );
  }

  const { summary, topPosts, topProjects } = data;

  const stats = [
    { label: 'Visitas totales', value: summary.total_views, icon: Eye },
    { label: 'Visitantes únicos', value: summary.unique_visitors, icon: Users },
    { label: 'Vistas a posts', value: summary.post_views, icon: FileText },
    { label: 'Vistas a proyectos', value: summary.project_views, icon: FolderGit2 },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader title="Analíticas" description="Visitas a tus posts, proyectos y páginas." />

      {summary.total_views === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Todavía no hay visitas"
          description="El seguimiento ya está activo. Cuando alguien visite tu sitio público, las visitas aparecerán aquí."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
              >
                <Icon className="h-4.5 w-4.5 text-muted" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-2xl font-semibold tracking-tight text-foreground">
                    {value.toLocaleString('es')}
                  </span>
                  <span className="text-xs text-muted">{label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-card border border-border bg-surface p-6">
            <h2 className="text-sm font-medium text-foreground">
              Visitas por día
              <span className="ml-2 text-xs font-normal text-muted">
                Últimos {ANALYTICS_RANGE_DAYS} días
              </span>
            </h2>
            <div className="mt-5">
              <ViewsChart data={buildDailySeries(data.daily)} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <TopResourceList
              title="Posts más vistos"
              items={topPosts}
              hrefBase="/posts"
              emptyText="Ningún post tiene visitas todavía."
            />
            <TopResourceList
              title="Proyectos más vistos"
              items={topProjects}
              hrefBase="/projects"
              emptyText="Ningún proyecto tiene visitas todavía."
            />
          </div>
        </>
      )}
    </div>
  );
}

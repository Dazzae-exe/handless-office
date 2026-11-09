import Link from 'next/link';
import { BarChart3, Eye, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getTotalViews } from '@/lib/supabase/analytics';
import { TABLES } from '@/lib/supabase/tables';
import { PageHeader } from '@/components/common/PageHeader';

export default async function DashboardPage() {
  const supabase = await createClient();

  const count = (published?: boolean) => {
    let query = supabase.from(TABLES.posts).select('*', { count: 'exact', head: true });
    if (published !== undefined) query = query.eq('published', published);
    return query;
  };

  const [postsRes, publishedRes, totalViews] = await Promise.all([
    count(),
    count(true),
    getTotalViews(),
  ]);

  const stats = [
    { label: 'Posts', value: postsRes.count ?? 0, icon: FileText },
    { label: 'Publicados', value: publishedRes.count ?? 0, icon: BarChart3 },
    { label: 'Vistas', value: totalViews, icon: Eye },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Resumen de tus posts."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
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
        <h2 className="text-sm font-medium text-foreground">Analíticas del sitio</h2>
        <p className="mt-1 text-sm text-muted">
          Las visitas de tu sitio público se registran automáticamente. Revisa el
          detalle por día y los posts más vistos en{' '}
          <Link href="/analytics" className="text-accent hover:underline">
            Analíticas
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

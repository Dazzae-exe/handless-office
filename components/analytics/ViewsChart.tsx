'use client';

import type { DailyViews } from '@/types/analytics';

interface ViewsChartProps {
  data: DailyViews[];
}

const DAY_FORMAT = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

function formatDay(day: string): string {
  return DAY_FORMAT.format(new Date(`${day}T00:00:00Z`));
}

function niceMax(max: number): number {
  if (max <= 5) return 5;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / magnitude) * magnitude;
}

export function ViewsChart({ data }: ViewsChartProps) {
  const max = niceMax(Math.max(...data.map((d) => d.views), 0));

  return (
    <div>
      <div className="relative h-40" aria-hidden="true">
        {[0, 0.5, 1].map((fraction) => (
          <div
            key={fraction}
            className="absolute inset-x-0 border-t border-border"
            style={{ top: `${fraction * 100}%` }}
          />
        ))}
        <span className="absolute -top-2 right-0 text-[10px] tabular-nums text-muted">
          {max.toLocaleString('es')}
        </span>

        <div className="absolute inset-0 flex items-end gap-[2px]">
          {data.map(({ day, views }) => (
            <div
              key={day}
              className="group relative flex h-full max-w-6 flex-1 items-end justify-center"
            >
              {views > 0 ? (
                <div
                  className="w-full rounded-t bg-accent transition-opacity group-hover:opacity-80"
                  style={{ height: `max(${(views / max) * 100}%, 2px)` }}
                />
              ) : null}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-sm group-hover:block">
                <span className="font-semibold text-foreground">
                  {views.toLocaleString('es')} {views === 1 ? 'visita' : 'visitas'}
                </span>
                <span className="text-muted"> · {formatDay(day)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-muted" aria-hidden="true">
        <span>{formatDay(data[0].day)}</span>
        <span>{formatDay(data[Math.floor(data.length / 2)].day)}</span>
        <span>{formatDay(data[data.length - 1].day)}</span>
      </div>

      {/* Alternativa accesible: los tooltips nunca son la única vía al dato */}
      <table className="sr-only">
        <caption>Visitas por día, últimos {data.length} días</caption>
        <thead>
          <tr>
            <th scope="col">Día</th>
            <th scope="col">Visitas</th>
          </tr>
        </thead>
        <tbody>
          {data.map(({ day, views }) => (
            <tr key={day}>
              <td>{formatDay(day)}</td>
              <td>{views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

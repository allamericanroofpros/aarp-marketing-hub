import { useFilter } from '@/contexts/FilterContext';
import { useAnalyticsKPIs, useFunnel, useTopPages, useUTMPerformance } from '@/hooks/useApi';
import { KpiCard } from '@/components/shared/KpiCard';
import { fmtN } from '@/lib/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const { startDate, endDate, locations } = useFilter();
  const f = { startDate, endDate, locations };

  const { data: kpis, isLoading: k } = useAnalyticsKPIs(f);
  const { data: funnel, isLoading: fu } = useFunnel(f);
  const { data: topPages, isLoading: tp } = useTopPages(f);
  const { data: utmPerf, isLoading: up } = useUTMPerformance(f);

  if (k || !kpis || fu || !funnel) return <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>;

  const cards = [
    { label: 'Sessions', value: fmtN(kpis.sessions) },
    { label: 'Pageviews', value: fmtN(kpis.pageviews) },
    { label: 'Unique Visitors', value: fmtN(kpis.uniqueVisitors) },
    { label: 'Form Starts', value: fmtN(kpis.formStarts) },
    { label: 'Form Submits', value: fmtN(kpis.formSubmits) },
    { label: 'CVR', value: kpis.cvr.toFixed(1) + '%' },
    { label: 'Avg Time on Page', value: kpis.avgTimeOnPage + 's' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Analytics</h2>
        <p className="text-xs text-muted-foreground">Website tracking — sessions, events, funnels</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {cards.map(c => <KpiCard key={c.label} label={c.label} value={c.value} />)}
      </div>
      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold mb-3">Conversion Funnel</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,18%)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(215,10%,50%)' }} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: 'hsl(215,10%,50%)' }} width={100} />
              <Tooltip contentStyle={{ background: 'hsl(220,18%,13%)', border: '1px solid hsl(220,15%,18%)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(205,100%,55%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-3 mt-3 flex-wrap">
          {funnel.map((s, i) => (
            <div key={s.label} className="text-center">
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="text-sm font-bold">{fmtN(s.count)}</p>
              {i > 0 && <p className="text-[10px] text-status-red">↓ {s.dropoff.toFixed(1)}%</p>}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold mb-3">Top Pages</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="text-left py-2 px-2">Page</th>
                <th className="text-right py-2 px-2">Views</th>
                <th className="text-right py-2 px-2">Exits</th>
                <th className="text-right py-2 px-2">Starts</th>
                <th className="text-right py-2 px-2">Submits</th>
                <th className="text-right py-2 px-2">CVR</th>
              </tr>
            </thead>
            <tbody>
              {(topPages || []).slice(0, 10).map(p => (
                <tr key={p.url} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-1.5 px-2 font-mono font-medium">{p.url}</td>
                  <td className="text-right py-1.5 px-2">{p.views}</td>
                  <td className="text-right py-1.5 px-2">{p.exits}</td>
                  <td className="text-right py-1.5 px-2">{p.formStarts}</td>
                  <td className="text-right py-1.5 px-2">{p.formSubmits}</td>
                  <td className="text-right py-1.5 px-2 font-semibold">{p.cvr.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold mb-3">UTM Campaign Performance</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="text-left py-2 px-2">Campaign</th>
                <th className="text-right py-2 px-2">Sessions</th>
                <th className="text-right py-2 px-2">Submits</th>
                <th className="text-right py-2 px-2">Deals</th>
                <th className="text-right py-2 px-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(utmPerf || []).slice(0, 10).map(u => (
                <tr key={u.utm_campaign} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-1.5 px-2 font-mono font-medium">{u.utm_campaign}</td>
                  <td className="text-right py-1.5 px-2">{u.sessions}</td>
                  <td className="text-right py-1.5 px-2">{u.submits}</td>
                  <td className="text-right py-1.5 px-2">{u.deals}</td>
                  <td className="text-right py-1.5 px-2 font-medium">${u.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

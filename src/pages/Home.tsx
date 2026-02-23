import { useFilter } from '@/contexts/FilterContext';
import { useHomeData } from '@/hooks/useApi';
import { KpiCard } from '@/components/shared/KpiCard';
import { fmt$, fmtN, fmtP } from '@/lib/format';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingDown, HelpCircle } from 'lucide-react';

export default function Home() {
  const { startDate, endDate, locations } = useFilter();
  const { data: result, isLoading } = useHomeData({ startDate, endDate, locations });

  if (isLoading || !result) return <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>;

  const { kpis, deltas, trendData, topSources, alerts } = result;

  const cards = [
    { label: 'Total Spend', value: fmt$(kpis.spend), delta: deltas.spend },
    { label: 'Leads', value: fmtN(kpis.leads), delta: deltas.leads },
    { label: 'CPL', value: fmt$(kpis.cpl), delta: deltas.cpl, invertDelta: true },
    { label: 'Appointments', value: fmtN(kpis.appointments), delta: deltas.appointments },
    { label: 'Cost/Appt', value: fmt$(kpis.costPerAppointment), delta: deltas.costPerAppointment, invertDelta: true },
    { label: 'Deals Won', value: fmtN(kpis.dealsWon), delta: deltas.dealsWon },
    { label: 'Close Rate', value: fmtP(kpis.closeRate), delta: deltas.closeRate },
    { label: 'Revenue', value: fmt$(kpis.revenue), delta: deltas.revenue },
    { label: 'Gross Profit', value: fmt$(kpis.grossProfit), delta: deltas.grossProfit },
    { label: 'ROAS', value: kpis.roas.toFixed(1) + 'x', delta: deltas.roas },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Executive Overview</h2>
        <p className="text-xs text-muted-foreground">All American Roof Pros — Marketing Command Center</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        {cards.map(c => <KpiCard key={c.label} {...c} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold mb-3">Spend vs Revenue</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,18%)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(215,10%,50%)' }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(215,10%,50%)' }} />
                <Tooltip contentStyle={{ background: 'hsl(220,18%,13%)', border: '1px solid hsl(220,15%,18%)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="spend" stroke="hsl(205,100%,55%)" fill="hsl(205,100%,55%,0.15)" name="Spend" />
                <Area type="monotone" dataKey="revenue" stroke="hsl(152,70%,45%)" fill="hsl(152,70%,45%,0.15)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold mb-3">Alerts & Insights</h3>
          <div className="space-y-2.5">
            {alerts.length === 0 && <p className="text-xs text-muted-foreground">No alerts.</p>}
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                {a.type === 'danger' ? <TrendingDown size={13} className="text-status-red mt-0.5 shrink-0" /> :
                 a.type === 'warning' ? <AlertTriangle size={13} className="text-status-yellow mt-0.5 shrink-0" /> :
                 <HelpCircle size={13} className="text-primary mt-0.5 shrink-0" />}
                <span className="text-muted-foreground">{a.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold mb-3">Top Sources by Revenue</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wider">
                <th className="text-left py-2 px-2">Source</th>
                <th className="text-right py-2 px-2">Spend</th>
                <th className="text-right py-2 px-2">Leads</th>
                <th className="text-right py-2 px-2">CPL</th>
                <th className="text-right py-2 px-2">Revenue</th>
                <th className="text-right py-2 px-2">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {topSources.map(s => (
                <tr key={s.name} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 px-2 font-medium">{s.name}</td>
                  <td className="text-right py-2 px-2">{fmt$(s.spend)}</td>
                  <td className="text-right py-2 px-2">{s.leads}</td>
                  <td className="text-right py-2 px-2">{fmt$(s.cpl)}</td>
                  <td className="text-right py-2 px-2">{fmt$(s.revenue)}</td>
                  <td className="text-right py-2 px-2 font-semibold">{s.roas.toFixed(1)}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

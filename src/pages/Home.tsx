import { useMemo } from 'react';
import { useFilter } from '@/contexts/FilterContext';
import { getMockData } from '@/data/mockState';
import { computeKpis, computeDeltas, filterByDateRange, fmt$, fmtN, fmtP } from '@/services/metrics';
import { resolveSource } from '@/services/attribution';
import { KpiCard } from '@/components/shared/KpiCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingDown, HelpCircle } from 'lucide-react';
import { subDays, format } from 'date-fns';

export default function Home() {
  const { startDate, endDate, locations } = useFilter();
  const data = getMockData();

  const filtered = useMemo(() => {
    let leads = filterByDateRange(data.leads, 'created_date', startDate, endDate);
    let spend = filterByDateRange(data.spend, 'date', startDate, endDate);
    if (locations.length > 0) {
      leads = leads.filter(l => locations.includes(l.location));
      spend = spend.filter(s => locations.includes(s.location));
    }
    const leadIds = new Set(leads.map(l => l.id));
    const deals = data.deals.filter(d => leadIds.has(d.lead_id));
    return { leads, deals, spend };
  }, [data, startDate, endDate, locations]);

  const kpis = useMemo(() => computeKpis(filtered.leads, filtered.deals, filtered.spend), [filtered]);

  const prevKpis = useMemo(() => {
    const days = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000));
    const pEnd = format(subDays(new Date(startDate), 1), 'yyyy-MM-dd');
    const pStart = format(subDays(new Date(startDate), days), 'yyyy-MM-dd');
    let leads = filterByDateRange(data.leads, 'created_date', pStart, pEnd);
    let spend = filterByDateRange(data.spend, 'date', pStart, pEnd);
    if (locations.length > 0) {
      leads = leads.filter(l => locations.includes(l.location));
      spend = spend.filter(s => locations.includes(s.location));
    }
    const leadIds = new Set(leads.map(l => l.id));
    const deals = data.deals.filter(d => leadIds.has(d.lead_id));
    return computeKpis(leads, deals, spend);
  }, [data, startDate, endDate, locations]);

  const deltas = computeDeltas(kpis, prevKpis);

  const trendData = useMemo(() => {
    const days: Record<string, { date: string; spend: number; revenue: number }> = {};
    filtered.spend.forEach(s => {
      if (!days[s.date]) days[s.date] = { date: s.date, spend: 0, revenue: 0 };
      days[s.date].spend += s.amount;
    });
    filtered.deals.filter(d => d.status === 'won').forEach(d => {
      if (!days[d.close_date]) days[d.close_date] = { date: d.close_date, spend: 0, revenue: 0 };
      days[d.close_date].revenue += d.revenue;
    });
    return Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const topSources = useMemo(() => {
    const m: Record<string, { name: string; spend: number; leads: number; revenue: number }> = {};
    filtered.leads.forEach(lead => {
      const sid = resolveSource(lead, data.mappingRules);
      const name = sid ? (data.sources.find(s => s.id === sid)?.name || 'Unknown') : 'Unmapped';
      if (!m[name]) m[name] = { name, spend: 0, leads: 0, revenue: 0 };
      m[name].leads++;
    });
    filtered.deals.filter(d => d.status === 'won').forEach(deal => {
      const lead = data.leads.find(l => l.id === deal.lead_id);
      if (!lead) return;
      const sid = resolveSource(lead, data.mappingRules);
      const name = sid ? (data.sources.find(s => s.id === sid)?.name || 'Unknown') : 'Unmapped';
      if (!m[name]) m[name] = { name, spend: 0, leads: 0, revenue: 0 };
      m[name].revenue += deal.revenue;
    });
    filtered.spend.forEach(s => {
      const name = s.campaign_name.includes('google-search') ? 'PPC – Google Search'
        : s.campaign_name.includes('lsa') ? 'PPC – Google LSA'
        : s.campaign_name.includes('fb') ? 'PPC – Facebook'
        : s.campaign_name.includes('eddm') ? 'Direct Mail – EDDM Feb 2026'
        : s.campaign_name.includes('targeted') ? 'Direct Mail – Targeted Mail' : 'Other';
      if (!m[name]) m[name] = { name, spend: 0, leads: 0, revenue: 0 };
      m[name].spend += s.amount;
    });
    return Object.values(m)
      .map(s => ({ ...s, roas: s.spend > 0 ? s.revenue / s.spend : 0, cpl: s.leads > 0 ? s.spend / s.leads : 0 }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filtered, data]);

  const alerts = useMemo(() => {
    const items: { type: string; text: string }[] = [];
    const unmapped = filtered.leads.filter(l => resolveSource(l, data.mappingRules) === null);
    if (unmapped.length > 5) items.push({ type: 'warning', text: `${unmapped.length} unmapped leads need source attribution` });
    if (kpis.cpl > 100) items.push({ type: 'danger', text: `CPL is ${fmt$(kpis.cpl)} — review underperforming channels` });
    topSources.forEach(s => {
      if (s.spend > 500 && s.roas < 2) items.push({ type: 'warning', text: `${s.name}: low ROAS (${s.roas.toFixed(1)}x) on ${fmt$(s.spend)} spend` });
    });
    if (kpis.closeRate < 0.15) items.push({ type: 'info', text: `Close rate ${fmtP(kpis.closeRate)} — consider rep coaching` });
    return items.slice(0, 5);
  }, [filtered, data, kpis, topSources]);

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

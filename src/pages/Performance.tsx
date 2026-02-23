import { useMemo, useState } from 'react';
import { useFilter } from '@/contexts/FilterContext';
import { getMockData } from '@/data/mockState';
import { filterByDateRange, fmt$, fmtN, fmtP } from '@/services/metrics';
import { resolveSource } from '@/services/attribution';

export default function Performance() {
  const { startDate, endDate, locations } = useFilter();
  const data = getMockData();
  const [tab, setTab] = useState<'channels' | 'reps'>('channels');
  const [sortKey, setSortKey] = useState('revenue');
  const [sortAsc, setSortAsc] = useState(false);

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

  const channelData = useMemo(() => {
    const m: Record<string, any> = {};
    filtered.leads.forEach(lead => {
      const sid = resolveSource(lead, data.mappingRules);
      const src = sid ? data.sources.find(s => s.id === sid) : null;
      const name = src?.name || 'Unmapped';
      const type = src?.type || '—';
      if (!m[name]) m[name] = { name, type, spend: 0, leads: 0, appointments: 0, dealsWon: 0, revenue: 0 };
      m[name].leads++;
      if (lead.appointment_set) m[name].appointments++;
    });
    filtered.deals.filter(d => d.status === 'won').forEach(deal => {
      const lead = data.leads.find(l => l.id === deal.lead_id);
      if (!lead) return;
      const sid = resolveSource(lead, data.mappingRules);
      const name = sid ? (data.sources.find(s => s.id === sid)?.name || 'Unknown') : 'Unmapped';
      if (!m[name]) m[name] = { name, type: '—', spend: 0, leads: 0, appointments: 0, dealsWon: 0, revenue: 0 };
      m[name].dealsWon++;
      m[name].revenue += deal.revenue;
    });
    filtered.spend.forEach(s => {
      const name = s.campaign_name.includes('google-search') ? 'PPC – Google Search'
        : s.campaign_name.includes('lsa') ? 'PPC – Google LSA'
        : s.campaign_name.includes('fb') ? 'PPC – Facebook'
        : s.campaign_name.includes('eddm') ? 'Direct Mail – EDDM Feb 2026'
        : s.campaign_name.includes('targeted') ? 'Direct Mail – Targeted Mail' : 'Other';
      if (!m[name]) m[name] = { name, type: '—', spend: 0, leads: 0, appointments: 0, dealsWon: 0, revenue: 0 };
      m[name].spend += s.amount;
    });
    return Object.values(m).map((s: any) => ({
      ...s,
      cpl: s.leads > 0 ? s.spend / s.leads : 0,
      cpAppt: s.appointments > 0 ? s.spend / s.appointments : 0,
      closeRate: s.leads > 0 ? s.dealsWon / s.leads : 0,
      gpEst: s.revenue * 0.48,
      roas: s.spend > 0 ? s.revenue / s.spend : 0,
    })).sort((a: any, b: any) => sortAsc ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]);
  }, [filtered, data, sortKey, sortAsc]);

  const repData = useMemo(() => {
    const m: Record<string, any> = {};
    data.reps.forEach(rep => {
      m[rep.id] = { name: rep.name, role: rep.role, location: '', leads: 0, appointments: 0, dealsWon: 0, revenue: 0 };
    });
    filtered.leads.forEach(l => {
      if (!m[l.rep]) return;
      m[l.rep].leads++;
      m[l.rep].location = l.location;
      if (l.appointment_set) m[l.rep].appointments++;
    });
    filtered.deals.filter(d => d.status === 'won').forEach(d => {
      if (!m[d.rep]) return;
      m[d.rep].dealsWon++;
      m[d.rep].revenue += d.revenue;
    });
    return Object.values(m).map((r: any) => ({
      ...r,
      closeRate: r.leads > 0 ? r.dealsWon / r.leads : 0,
      avgDeal: r.dealsWon > 0 ? r.revenue / r.dealsWon : 0,
    })).sort((a: any, b: any) => b.revenue - a.revenue);
  }, [filtered, data]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const thCls = "text-left py-2 px-2 cursor-pointer hover:text-foreground transition-colors";
  const thRCls = "text-right py-2 px-2 cursor-pointer hover:text-foreground transition-colors";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Performance</h2>
      <div className="flex gap-1">
        {(['channels', 'reps'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
            {t === 'channels' ? 'Channels' : 'Reps'}
          </button>
        ))}
      </div>

      {tab === 'channels' && (
        <div className="bg-card rounded-lg border border-border p-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className={thCls} onClick={() => handleSort('name')}>Source</th>
                <th className={thCls}>Type</th>
                <th className={thRCls} onClick={() => handleSort('spend')}>Spend</th>
                <th className={thRCls} onClick={() => handleSort('leads')}>Leads</th>
                <th className={thRCls} onClick={() => handleSort('cpl')}>CPL</th>
                <th className={thRCls} onClick={() => handleSort('appointments')}>Appts</th>
                <th className={thRCls} onClick={() => handleSort('dealsWon')}>Won</th>
                <th className={thRCls} onClick={() => handleSort('closeRate')}>Close%</th>
                <th className={thRCls} onClick={() => handleSort('revenue')}>Revenue</th>
                <th className={thRCls} onClick={() => handleSort('roas')}>ROAS</th>
              </tr>
            </thead>
            <tbody>
              {channelData.map((c: any) => (
                <tr key={c.name} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 px-2 font-medium">{c.name}</td>
                  <td className="py-2 px-2 text-muted-foreground">{c.type}</td>
                  <td className="text-right py-2 px-2">{fmt$(c.spend)}</td>
                  <td className="text-right py-2 px-2">{c.leads}</td>
                  <td className="text-right py-2 px-2">{fmt$(c.cpl)}</td>
                  <td className="text-right py-2 px-2">{c.appointments}</td>
                  <td className="text-right py-2 px-2">{c.dealsWon}</td>
                  <td className="text-right py-2 px-2">{fmtP(c.closeRate)}</td>
                  <td className="text-right py-2 px-2 font-medium">{fmt$(c.revenue)}</td>
                  <td className="text-right py-2 px-2 font-semibold">{c.roas.toFixed(1)}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'reps' && (
        <div className="bg-card rounded-lg border border-border p-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className={thCls}>Rep</th>
                <th className={thCls}>Role</th>
                <th className={thCls}>Location</th>
                <th className={thRCls}>Leads</th>
                <th className={thRCls}>Appts</th>
                <th className={thRCls}>Won</th>
                <th className={thRCls}>Close%</th>
                <th className={thRCls}>Revenue</th>
                <th className={thRCls}>Avg Deal</th>
              </tr>
            </thead>
            <tbody>
              {repData.map((r: any) => (
                <tr key={r.name} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 px-2 font-medium">{r.name}</td>
                  <td className="py-2 px-2 text-muted-foreground">{r.role}</td>
                  <td className="py-2 px-2">{r.location}</td>
                  <td className="text-right py-2 px-2">{r.leads}</td>
                  <td className="text-right py-2 px-2">{r.appointments}</td>
                  <td className="text-right py-2 px-2">{r.dealsWon}</td>
                  <td className="text-right py-2 px-2">{fmtP(r.closeRate)}</td>
                  <td className="text-right py-2 px-2 font-medium">{fmt$(r.revenue)}</td>
                  <td className="text-right py-2 px-2">{fmt$(r.avgDeal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useFilter } from '@/contexts/FilterContext';
import { getMockData } from '@/data/mockState';
import { filterByDateRange, fmt$ } from '@/services/metrics';
import { resolveSource } from '@/services/attribution';
import { Download } from 'lucide-react';

export default function Pipeline() {
  const { startDate, endDate, locations } = useFilter();
  const data = getMockData();
  const [tab, setTab] = useState<'leads' | 'deals'>('leads');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    let leads = filterByDateRange(data.leads, 'created_date', startDate, endDate);
    if (locations.length > 0) leads = leads.filter(l => locations.includes(l.location));
    if (statusFilter !== 'all' && tab === 'leads') leads = leads.filter(l => l.status === statusFilter);
    const leadIds = new Set(leads.map(l => l.id));
    let deals = data.deals.filter(d => leadIds.has(d.lead_id));
    if (statusFilter !== 'all' && tab === 'deals') deals = deals.filter(d => d.status === statusFilter);
    return { leads, deals };
  }, [data, startDate, endDate, locations, statusFilter, tab]);

  const exportCSV = () => {
    const rows = tab === 'leads'
      ? [['ID','Date','Location','Rep','Status','Type','Source','UTM Source'].join(','),
         ...filtered.leads.map(l => {
           const sid = resolveSource(l, data.mappingRules);
           const sname = sid ? (data.sources.find(s => s.id === sid)?.name || '') : 'Unmapped';
           return [l.id, l.created_date, l.location, data.reps.find(r => r.id === l.rep)?.name || l.rep, l.status, l.lead_type, sname, l.utm_source].join(',');
         })]
      : [['ID','Close Date','Rep','Status','Revenue','Job Type','Days to Close'].join(','),
         ...filtered.deals.map(d => [d.id, d.close_date, data.reps.find(r => r.id === d.rep)?.name || d.rep, d.status, d.revenue, d.job_type, d.days_to_close].join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${tab}-export.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const leadStatuses = ['all', 'new', 'contacted', 'scheduled', 'ran', 'no-show', 'unqualified'];
  const dealStatuses = ['all', 'won', 'lost'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Pipeline</h2>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium text-muted-foreground hover:bg-secondary transition-colors border border-border">
          <Download size={12} /> Export CSV
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1">
          {(['leads', 'deals'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setStatusFilter('all'); }}
              className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
              {t === 'leads' ? `Leads (${filtered.leads.length})` : `Deals (${filtered.deals.length})`}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-border" />
        {(tab === 'leads' ? leadStatuses : dealStatuses).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-2 py-1 text-[11px] rounded font-medium transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-lg border border-border p-4 overflow-x-auto">
        {tab === 'leads' ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="text-left py-2 px-2">Date</th>
                <th className="text-left py-2 px-2">Location</th>
                <th className="text-left py-2 px-2">Rep</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-left py-2 px-2">Source</th>
                <th className="text-left py-2 px-2">Appt</th>
              </tr>
            </thead>
            <tbody>
              {filtered.leads.slice(0, 100).map(l => {
                const sid = resolveSource(l, data.mappingRules);
                const sname = sid ? (data.sources.find(s => s.id === sid)?.name || '?') : 'Unmapped';
                return (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-1.5 px-2">{l.created_date}</td>
                    <td className="py-1.5 px-2">{l.location}</td>
                    <td className="py-1.5 px-2">{data.reps.find(r => r.id === l.rep)?.name || l.rep}</td>
                    <td className="py-1.5 px-2">{l.lead_type}</td>
                    <td className="py-1.5 px-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${l.status === 'ran' ? 'bg-status-green/20 text-status-green' : l.status === 'no-show' ? 'bg-status-red/20 text-status-red' : 'bg-secondary text-secondary-foreground'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-muted-foreground">{sname}</td>
                    <td className="py-1.5 px-2">{l.appointment_set ? '✓' : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="text-left py-2 px-2">Close Date</th>
                <th className="text-left py-2 px-2">Rep</th>
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-right py-2 px-2">Revenue</th>
                <th className="text-left py-2 px-2">Job Type</th>
                <th className="text-right py-2 px-2">Days</th>
                <th className="text-left py-2 px-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.deals.slice(0, 100).map(d => {
                const lead = data.leads.find(l => l.id === d.lead_id);
                const sid = lead ? resolveSource(lead, data.mappingRules) : null;
                const sname = sid ? (data.sources.find(s => s.id === sid)?.name || '?') : 'Unmapped';
                return (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-1.5 px-2">{d.close_date}</td>
                    <td className="py-1.5 px-2">{data.reps.find(r => r.id === d.rep)?.name || d.rep}</td>
                    <td className="py-1.5 px-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${d.status === 'won' ? 'bg-status-green/20 text-status-green' : 'bg-status-red/20 text-status-red'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="text-right py-1.5 px-2 font-medium">{fmt$(d.revenue)}</td>
                    <td className="py-1.5 px-2">{d.job_type}</td>
                    <td className="text-right py-1.5 px-2">{d.days_to_close}</td>
                    <td className="py-1.5 px-2 text-muted-foreground">{sname}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {(tab === 'leads' ? filtered.leads.length : filtered.deals.length) > 100 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">Showing first 100 of {tab === 'leads' ? filtered.leads.length : filtered.deals.length} records</p>
        )}
      </div>
    </div>
  );
}

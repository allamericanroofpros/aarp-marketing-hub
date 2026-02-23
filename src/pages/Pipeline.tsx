import { useState } from 'react';
import { useFilter } from '@/contexts/FilterContext';
import { useLeads, useDeals, useContactTimeline } from '@/hooks/useApi';
import { fmt$ } from '@/lib/format';
import { Download, X, User, Globe, Play, FileText, Tag } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function Pipeline() {
  const { startDate, endDate, locations } = useFilter();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'leads' | 'deals') || 'leads';
  const sourceFilter = searchParams.get('source') || '';
  const repFilter = searchParams.get('rep') || '';

  const [tab, setTab] = useState<'leads' | 'deals'>(initialTab);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const leadsFilter = { startDate, endDate, locations, sourceFilter, repFilter, statusFilter: tab === 'leads' ? statusFilter : 'all' };
  const dealsFilter = { startDate, endDate, locations, sourceFilter, repFilter, statusFilter: tab === 'deals' ? statusFilter : 'all' };

  const { data: leads = [], isLoading: ll } = useLeads(leadsFilter);
  const { data: deals = [], isLoading: dl } = useDeals(dealsFilter);
  const { data: timelineData } = useContactTimeline(selectedContactId);

  const loading = (tab === 'leads' && ll) || (tab === 'deals' && dl);

  const exportCSV = () => {
    const rows = tab === 'leads'
      ? [['ID','Date','Location','Rep','Status','Type','Source','UTM Source'].join(','),
         ...leads.map((l: any) => [l.id, l.created_date, l.location, l.repName, l.status, l.lead_type, l.sourceName, l.utm_source].join(','))]
      : [['ID','Close Date','Rep','Status','Revenue','Job Type','Days to Close'].join(','),
         ...deals.map((d: any) => [d.id, d.close_date, d.repName, d.status, d.revenue, d.job_type, d.days_to_close].join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${tab}-export.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const leadStatuses = ['all', 'new', 'contacted', 'scheduled', 'ran', 'no-show', 'unqualified'];
  const dealStatuses = ['all', 'won', 'lost'];

  const typeIcon = (type: string) => {
    switch (type) {
      case 'session': return <Globe size={12} className="text-primary" />;
      case 'pageview': return <FileText size={12} className="text-muted-foreground" />;
      case 'form': case 'form_start': return <FileText size={12} className="text-status-green" />;
      case 'video': return <Play size={12} className="text-chart-5" />;
      case 'lead': return <User size={12} className="text-accent" />;
      case 'deal': return <Tag size={12} className="text-status-green" />;
      default: return <Globe size={12} />;
    }
  };

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
              {t === 'leads' ? `Leads (${leads.length})` : `Deals (${deals.length})`}
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
        {(sourceFilter || repFilter) && (
          <span className="text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded">
            Filtered{sourceFilter ? ` by source` : ''}{repFilter ? ` by rep` : ''}
          </span>
        )}
      </div>

      {loading ? <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div> : (
      <div className="flex gap-3">
        <div className={`bg-card rounded-lg border border-border p-4 overflow-x-auto ${selectedContactId ? 'flex-1' : 'w-full'}`}>
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
                {leads.slice(0, 100).map((l: any) => (
                  <tr key={l.id}
                    onClick={() => l.contact_id && setSelectedContactId(l.contact_id)}
                    className={`border-b border-border/50 hover:bg-muted/30 ${l.contact_id ? 'cursor-pointer' : ''}`}>
                    <td className="py-1.5 px-2">{l.created_date}</td>
                    <td className="py-1.5 px-2">{l.location}</td>
                    <td className="py-1.5 px-2">{l.repName}</td>
                    <td className="py-1.5 px-2">{l.lead_type}</td>
                    <td className="py-1.5 px-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${l.status === 'ran' ? 'bg-status-green/20 text-status-green' : l.status === 'no-show' ? 'bg-status-red/20 text-status-red' : 'bg-secondary text-secondary-foreground'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-muted-foreground">{l.sourceName}</td>
                    <td className="py-1.5 px-2">{l.appointment_set ? '✓' : '—'}</td>
                  </tr>
                ))}
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
                {deals.slice(0, 100).map((d: any) => (
                  <tr key={d.id}
                    onClick={() => d.leadContactId && setSelectedContactId(d.leadContactId)}
                    className={`border-b border-border/50 hover:bg-muted/30 ${d.leadContactId ? 'cursor-pointer' : ''}`}>
                    <td className="py-1.5 px-2">{d.close_date}</td>
                    <td className="py-1.5 px-2">{d.repName}</td>
                    <td className="py-1.5 px-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${d.status === 'won' ? 'bg-status-green/20 text-status-green' : 'bg-status-red/20 text-status-red'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="text-right py-1.5 px-2 font-medium">{fmt$(d.revenue)}</td>
                    <td className="py-1.5 px-2">{d.job_type}</td>
                    <td className="text-right py-1.5 px-2">{d.days_to_close}</td>
                    <td className="py-1.5 px-2 text-muted-foreground">{d.sourceName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {(tab === 'leads' ? leads.length : deals.length) > 100 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">Showing first 100 of {tab === 'leads' ? leads.length : deals.length} records</p>
          )}
        </div>

        {selectedContactId && timelineData && (
          <div className="w-96 bg-card rounded-lg border border-border p-4 overflow-y-auto max-h-[80vh] shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-1.5"><User size={14} className="text-primary" /> Contact Timeline</h3>
              <button onClick={() => setSelectedContactId(null)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
            <div className="bg-secondary/50 rounded p-3 mb-4 space-y-1">
              <p className="text-xs font-medium">{timelineData.contact.name || 'Anonymous Visitor'}</p>
              {timelineData.contact.email && <p className="text-[10px] text-muted-foreground">{timelineData.contact.email}</p>}
              {timelineData.contact.phone && <p className="text-[10px] text-muted-foreground">{timelineData.contact.phone}</p>}
              <p className="text-[10px] text-muted-foreground capitalize">{timelineData.contact.lifecycle_stage}</p>
            </div>
            <div className="flex gap-2 mb-4">
              {timelineData.firstTouchSrc && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">1st: {timelineData.firstTouchSrc}</span>}
              {timelineData.lastTouchSrc && <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded font-medium">Last: {timelineData.lastTouchSrc}</span>}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center bg-secondary/30 rounded p-2"><p className="text-[9px] text-muted-foreground">Sessions</p><p className="text-xs font-bold">{timelineData.sessions}</p></div>
              <div className="text-center bg-secondary/30 rounded p-2"><p className="text-[9px] text-muted-foreground">Videos</p><p className="text-xs font-bold">{timelineData.videosWatched}</p></div>
              <div className="text-center bg-secondary/30 rounded p-2"><p className="text-[9px] text-muted-foreground">Pages</p><p className="text-xs font-bold">{timelineData.pagesVisited}</p></div>
            </div>
            <div className="space-y-0">
              {timelineData.items.slice(0, 50).map((item, i) => (
                <div key={i} className="flex gap-2 py-1.5 border-l-2 border-border pl-3 ml-1">
                  <div className="mt-0.5 shrink-0">{typeIcon(item.type)}</div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium">{item.label}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{item.detail}</p>
                    <p className="text-[9px] text-muted-foreground/50">{item.ts.replace('T', ' ').slice(0, 16)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

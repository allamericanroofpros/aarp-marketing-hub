import { useState, useMemo } from 'react';
import { getMockData, updateMockData } from '@/data/mockState';
import { useFilter } from '@/contexts/FilterContext';
import { getUnmappedLeads, getUnmappedSpend, getUnmappedSessions } from '@/services/attribution';
import { filterByDateRange } from '@/services/metrics';
import { Copy, Check, Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function SourcesAttribution() {
  const data = getMockData();
  const { startDate, endDate } = useFilter();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'sources';

  const [tab, setTab] = useState<'sources' | 'rules' | 'unmapped' | 'utm'>(initialTab);
  const [copied, setCopied] = useState(false);
  const [utmBase, setUtmBase] = useState('https://allamericanroofpros.com/free-estimate');
  const [utmSource, setUtmSource] = useState('google');
  const [utmMedium, setUtmMedium] = useState('cpc');
  const [utmCampaign, setUtmCampaign] = useState('spring-2026');
  const [utmContent, setUtmContent] = useState('');

  const leads = useMemo(() => filterByDateRange(data.leads, 'created_date', startDate, endDate), [data, startDate, endDate]);
  const spend = useMemo(() => filterByDateRange(data.spend, 'date', startDate, endDate), [data, startDate, endDate]);
  const sessions = useMemo(() => data.sessions.filter(s => {
    const d = s.started_at.split('T')[0];
    return d >= startDate && d <= endDate;
  }), [data, startDate, endDate]);

  const unmappedLeads = useMemo(() => getUnmappedLeads(leads, data.mappingRules), [leads, data.mappingRules]);
  const unmappedSpend = useMemo(() => getUnmappedSpend(spend, data.mappingRules), [spend, data.mappingRules]);
  const unmappedSessions = useMemo(() => getUnmappedSessions(sessions, data.mappingRules), [sessions, data.mappingRules]);

  const utmUrl = `${utmBase}?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}${utmContent ? `&utm_content=${utmContent}` : ''}`;

  const copyUtm = () => {
    navigator.clipboard.writeText(utmUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickMap = (value: string, type: string) => {
    const newRule = {
      id: `mr-auto-${Date.now()}`,
      input_type: type as any,
      input_value: value,
      source_id: data.sources[0].id,
      priority: 10,
      is_active: true,
    };
    updateMockData({ ...data, mappingRules: [...data.mappingRules, newRule] });
  };

  const totalUnmapped = unmappedLeads.length + unmappedSpend.length + unmappedSessions.length;

  const tabs = [
    { key: 'sources', label: 'Sources' },
    { key: 'rules', label: 'Mapping Rules' },
    { key: 'unmapped', label: `Unmapped (${totalUnmapped})` },
    { key: 'utm', label: 'UTM Builder' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Sources & Attribution</h2>
      <div className="flex gap-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sources' && (
        <div className="bg-card rounded-lg border border-border p-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="text-left py-2 px-2">Name</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.sources.map(s => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 px-2 font-medium">{s.name}</td>
                  <td className="py-2 px-2 text-muted-foreground">{s.type}</td>
                  <td className="py-2 px-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${s.is_active ? 'bg-status-green/20 text-status-green' : 'bg-status-red/20 text-status-red'}`}>
                      {s.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'rules' && (
        <div className="bg-card rounded-lg border border-border p-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="text-left py-2 px-2">Input Type</th>
                <th className="text-left py-2 px-2">Value</th>
                <th className="text-left py-2 px-2">Maps To</th>
                <th className="text-right py-2 px-2">Priority</th>
                <th className="text-left py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.mappingRules.sort((a, b) => b.priority - a.priority).map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 px-2 text-muted-foreground">{r.input_type}</td>
                  <td className="py-2 px-2 font-mono font-medium">{r.input_value}</td>
                  <td className="py-2 px-2">{data.sources.find(s => s.id === r.source_id)?.name || r.source_id}</td>
                  <td className="text-right py-2 px-2">{r.priority}</td>
                  <td className="py-2 px-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.is_active ? 'bg-status-green/20 text-status-green' : 'bg-muted text-muted-foreground'}`}>
                      {r.is_active ? 'On' : 'Off'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'unmapped' && (
        <div className="space-y-4">
          {/* Unmapped Sessions */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold mb-3">Unmapped Sessions ({unmappedSessions.length})</h3>
            {unmappedSessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">All sessions mapped! 🎉</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">UTM Source</th>
                    <th className="text-left py-2 px-2">UTM Campaign</th>
                    <th className="text-left py-2 px-2">Landing Page</th>
                    <th className="text-left py-2 px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unmappedSessions.slice(0, 10).map(s => (
                    <tr key={s.id} className="border-b border-border/50">
                      <td className="py-1.5 px-2">{s.started_at.split('T')[0]}</td>
                      <td className="py-1.5 px-2 font-mono">{s.utm_source}</td>
                      <td className="py-1.5 px-2 font-mono">{s.utm_campaign || '—'}</td>
                      <td className="py-1.5 px-2 font-mono">{s.landing_page}</td>
                      <td className="py-1.5 px-2">
                        <button onClick={() => quickMap(s.utm_source, 'utm_source')}
                          className="flex items-center gap-1 text-primary text-[10px] hover:underline">
                          <Plus size={10} /> Map
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold mb-3">Unmapped Leads ({unmappedLeads.length})</h3>
            {unmappedLeads.length === 0 ? (
              <p className="text-xs text-muted-foreground">All leads are mapped! 🎉</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">UTM Source</th>
                    <th className="text-left py-2 px-2">UTM Campaign</th>
                    <th className="text-left py-2 px-2">Landing Page</th>
                    <th className="text-left py-2 px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unmappedLeads.slice(0, 20).map(l => (
                    <tr key={l.id} className="border-b border-border/50">
                      <td className="py-1.5 px-2">{l.created_date}</td>
                      <td className="py-1.5 px-2 font-mono">{l.utm_source}</td>
                      <td className="py-1.5 px-2 font-mono">{l.utm_campaign || '—'}</td>
                      <td className="py-1.5 px-2 font-mono">{l.landing_page}</td>
                      <td className="py-1.5 px-2">
                        <button onClick={() => quickMap(l.utm_source, 'utm_source')}
                          className="flex items-center gap-1 text-primary text-[10px] hover:underline">
                          <Plus size={10} /> Map
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold mb-3">Unmapped Spend ({unmappedSpend.length})</h3>
            {unmappedSpend.length === 0 ? (
              <p className="text-xs text-muted-foreground">All spend mapped! 🎉</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Campaign</th>
                    <th className="text-left py-2 px-2">Platform</th>
                    <th className="text-right py-2 px-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {unmappedSpend.slice(0, 10).map(s => (
                    <tr key={s.id} className="border-b border-border/50">
                      <td className="py-1.5 px-2">{s.date}</td>
                      <td className="py-1.5 px-2 font-mono">{s.campaign_name}</td>
                      <td className="py-1.5 px-2">{s.platform}</td>
                      <td className="text-right py-1.5 px-2">${s.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'utm' && (
        <div className="bg-card rounded-lg border border-border p-5 max-w-xl space-y-3">
          <h3 className="text-sm font-semibold">UTM Builder</h3>
          {[
            { label: 'Base URL', value: utmBase, set: setUtmBase },
            { label: 'Source', value: utmSource, set: setUtmSource },
            { label: 'Medium', value: utmMedium, set: setUtmMedium },
            { label: 'Campaign', value: utmCampaign, set: setUtmCampaign },
            { label: 'Content (optional)', value: utmContent, set: setUtmContent },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{f.label}</label>
              <input value={f.value} onChange={e => f.set(e.target.value)}
                className="w-full mt-1 bg-secondary border border-border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          ))}
          <div className="bg-secondary/50 rounded p-3 border border-border">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Generated URL</label>
            <p className="text-xs font-mono mt-1 break-all text-primary">{utmUrl}</p>
          </div>
          <button onClick={copyUtm}
            className="flex items-center gap-1.5 px-4 py-2 text-xs rounded font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy URL</>}
          </button>
        </div>
      )}
    </div>
  );
}

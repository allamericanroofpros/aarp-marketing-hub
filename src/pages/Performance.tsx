import { useState } from 'react';
import { useFilter } from '@/contexts/FilterContext';
import { useRollupBySource, useRollupByRep } from '@/hooks/useApi';
import { fmt$, fmtN, fmtP } from '@/lib/format';
import { useNavigate } from 'react-router-dom';

export default function Performance() {
  const { startDate, endDate, locations } = useFilter();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'channels' | 'reps'>('channels');
  const [sortKey, setSortKey] = useState('revenue');
  const [sortAsc, setSortAsc] = useState(false);

  const { data: channelRaw, isLoading: cl } = useRollupBySource({ startDate, endDate, locations });
  const { data: repData, isLoading: rl } = useRollupByRep({ startDate, endDate, locations });

  if ((tab === 'channels' && (cl || !channelRaw)) || (tab === 'reps' && (rl || !repData)))
    return <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>;

  const channelData = (channelRaw || []).slice().sort((a: any, b: any) => sortAsc ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]);
  const reps = (repData || []).slice().sort((a, b) => b.revenue - a.revenue);

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
                <th className={thRCls} onClick={() => handleSort('sessions')}>Sessions</th>
                <th className={thRCls} onClick={() => handleSort('dealsWon')}>Won</th>
                <th className={thRCls} onClick={() => handleSort('closeRate')}>Close%</th>
                <th className={thRCls} onClick={() => handleSort('revenue')}>Revenue</th>
                <th className={thRCls} onClick={() => handleSort('roas')}>ROAS</th>
              </tr>
            </thead>
            <tbody>
              {channelData.map((c) => (
                <tr key={c.name}
                  onClick={() => c.source_id && navigate(`/pipeline?source=${c.source_id}`)}
                  className="border-b border-border/50 hover:bg-muted/30 cursor-pointer">
                  <td className="py-2 px-2 font-medium">{c.name}</td>
                  <td className="py-2 px-2 text-muted-foreground">{c.type}</td>
                  <td className="text-right py-2 px-2">{fmt$(c.spend)}</td>
                  <td className="text-right py-2 px-2">{c.leads}</td>
                  <td className="text-right py-2 px-2">{fmt$(c.cpl)}</td>
                  <td className="text-right py-2 px-2">{c.appointments}</td>
                  <td className="text-right py-2 px-2">{fmtN(c.sessions)}</td>
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
                <th className={thCls}>Best Source</th>
              </tr>
            </thead>
            <tbody>
              {reps.map((r) => (
                <tr key={r.rep_id}
                  onClick={() => navigate(`/pipeline?rep=${r.rep_id}`)}
                  className="border-b border-border/50 hover:bg-muted/30 cursor-pointer">
                  <td className="py-2 px-2 font-medium">{r.name}</td>
                  <td className="py-2 px-2 text-muted-foreground">{r.role}</td>
                  <td className="py-2 px-2">{r.location}</td>
                  <td className="text-right py-2 px-2">{r.leads}</td>
                  <td className="text-right py-2 px-2">{r.appointments}</td>
                  <td className="text-right py-2 px-2">{r.dealsWon}</td>
                  <td className="text-right py-2 px-2">{fmtP(r.closeRate)}</td>
                  <td className="text-right py-2 px-2 font-medium">{fmt$(r.revenue)}</td>
                  <td className="text-right py-2 px-2">{fmt$(r.avgDeal)}</td>
                  <td className="py-2 px-2 text-muted-foreground text-[10px]">{r.bestSource}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

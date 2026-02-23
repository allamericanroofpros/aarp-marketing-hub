import { useState } from 'react';
import { useFilter } from '@/contexts/FilterContext';
import { useVideoLeaderboard, useVideoAttrition, useInfluencedConversions } from '@/hooks/useApi';
import { fmt$, fmtN } from '@/lib/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function VideoAnalyticsPage() {
  const { startDate, endDate } = useFilter();
  const [tab, setTab] = useState<'leaderboard' | 'attrition' | 'influenced'>('leaderboard');

  const { data: leaderboard = [], isLoading: ll } = useVideoLeaderboard({ startDate, endDate });
  const { data: attrition = [], isLoading: al } = useVideoAttrition();
  const { data: influenced = [], isLoading: il } = useInfluencedConversions();

  const loading = (tab === 'leaderboard' && ll) || (tab === 'attrition' && al) || (tab === 'influenced' && il);
  if (loading) return <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Video Analytics</h2>
        <p className="text-xs text-muted-foreground">Video engagement, attrition, and influenced conversions</p>
      </div>
      <div className="flex gap-1">
        {([
          { key: 'leaderboard', label: 'Leaderboard' },
          { key: 'attrition', label: 'Attrition' },
          { key: 'influenced', label: 'Influenced Conversions' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'leaderboard' && (
        <div className="bg-card rounded-lg border border-border p-4 overflow-x-auto">
          <h3 className="text-sm font-semibold mb-3">Video Performance</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="text-left py-2 px-2">Video</th>
                <th className="text-right py-2 px-2">Plays</th>
                <th className="text-right py-2 px-2">Avg Watch %</th>
                <th className="text-right py-2 px-2">Completion</th>
                <th className="text-right py-2 px-2">Infl. Leads</th>
                <th className="text-right py-2 px-2">Infl. Revenue</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map(v => (
                <tr key={v.video_id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 px-2 font-medium max-w-[200px] truncate">{v.title}</td>
                  <td className="text-right py-2 px-2">{fmtN(v.plays)}</td>
                  <td className="text-right py-2 px-2">{v.avgWatchPct.toFixed(0)}%</td>
                  <td className="text-right py-2 px-2">{v.completionRate.toFixed(1)}%</td>
                  <td className="text-right py-2 px-2">{v.influencedLeads}</td>
                  <td className="text-right py-2 px-2 font-medium">{fmt$(v.influencedRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'attrition' && (
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold mb-3">Video Attrition (All Videos)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attrition}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,18%)" />
                <XAxis dataKey="percent" tick={{ fontSize: 10, fill: 'hsl(215,10%,50%)' }} tickFormatter={v => `${v}%`} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215,10%,50%)' }} tickFormatter={v => `${v.toFixed(0)}%`} />
                <Tooltip contentStyle={{ background: 'hsl(220,18%,13%)', border: '1px solid hsl(220,15%,18%)', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="pct" fill="hsl(152,70%,45%)" radius={[4, 4, 0, 0]} name="Reached %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-5 gap-2 mt-4">
            {attrition.map(a => (
              <div key={a.percent} className="text-center bg-secondary/50 rounded p-2">
                <p className="text-[10px] text-muted-foreground">≥{a.percent}%</p>
                <p className="text-sm font-bold">{a.pct.toFixed(0)}%</p>
                <p className="text-[10px] text-muted-foreground">{fmtN(a.count)} viewers</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'influenced' && (
        <div className="bg-card rounded-lg border border-border p-4 overflow-x-auto">
          <h3 className="text-sm font-semibold mb-3">Video-Influenced Conversions</h3>
          {influenced.length === 0 ? (
            <p className="text-xs text-muted-foreground">No influenced conversions found.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                  <th className="text-left py-2 px-2">Contact</th>
                  <th className="text-left py-2 px-2">Video</th>
                  <th className="text-right py-2 px-2">Watched</th>
                  <th className="text-right py-2 px-2">Days to Convert</th>
                  <th className="text-right py-2 px-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {influenced.map((ic, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-2 font-medium">{ic.contact_name}</td>
                    <td className="py-2 px-2 text-muted-foreground max-w-[180px] truncate">{ic.video_title}</td>
                    <td className="text-right py-2 px-2">{ic.percent_watched}%</td>
                    <td className="text-right py-2 px-2">{ic.days_to_convert}d</td>
                    <td className="text-right py-2 px-2 font-medium">{fmt$(ic.deal_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

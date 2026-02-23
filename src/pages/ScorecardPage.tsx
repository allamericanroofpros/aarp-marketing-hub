import { useState } from 'react';
import { useScorecards } from '@/hooks/useApi';
import { fmt$, fmtP } from '@/lib/format';
import { ClipboardList, Trophy, AlertTriangle, CheckCircle2, MessageSquare } from 'lucide-react';

export default function ScorecardPage() {
  const { data: scorecards = [], isLoading } = useScorecards();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'meeting'>('list');

  if (isLoading) return <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>;

  const selected = selectedId ? scorecards.find(s => s.id === selectedId) : null;
  const gradeColor = (g: string) => g === 'green' ? 'bg-status-green/20 text-status-green border-status-green/30' : g === 'yellow' ? 'bg-status-yellow/20 text-status-yellow border-status-yellow/30' : 'bg-status-red/20 text-status-red border-status-red/30';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Scorecards</h2>
        <div className="flex gap-1">
          {(['list', 'meeting'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
              {v === 'list' ? 'Scorecards' : 'Meeting Mode'}
            </button>
          ))}
        </div>
      </div>

      {view === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="space-y-2 max-h-[75vh] overflow-y-auto">
            {scorecards.map(sc => (
              <button key={sc.id} onClick={() => setSelectedId(sc.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedId === sc.id ? 'bg-primary/10 border-primary/40' : 'bg-card border-border hover:border-primary/20'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{sc.period === 'monthly' ? '📅 Monthly' : '📋 Weekly'}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${gradeColor(sc.grade)}`}>{sc.grade.toUpperCase()}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{sc.start_date} → {sc.end_date}</p>
                <p className="text-[10px] text-muted-foreground">{sc.owner}</p>
              </button>
            ))}
          </div>
          <div className="lg:col-span-2">
            {selected ? (
              <div className="bg-card rounded-lg border border-border p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div><h3 className="text-sm font-bold">{selected.period === 'monthly' ? 'Monthly' : 'Weekly'} Scorecard</h3><p className="text-xs text-muted-foreground">{selected.start_date} → {selected.end_date} · {selected.owner}</p></div>
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${gradeColor(selected.grade)}`}>{selected.grade.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: 'Spend', value: fmt$(selected.metrics.spend) },
                    { label: 'Leads', value: String(selected.metrics.leads) },
                    { label: 'CPL', value: fmt$(selected.metrics.cpl) },
                    { label: 'Appts', value: String(selected.metrics.appointments) },
                    { label: 'Close Rate', value: fmtP(selected.metrics.close_rate) },
                    { label: 'Revenue', value: fmt$(selected.metrics.revenue) },
                    { label: 'ROAS', value: selected.metrics.roas.toFixed(1) + 'x' },
                    { label: 'Gross Profit', value: fmt$(selected.metrics.gross_profit_est) },
                  ].map(m => (
                    <div key={m.label} className="bg-secondary/50 rounded p-2.5 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">{m.label}</p>
                      <p className="text-sm font-bold mt-0.5">{m.value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="text-xs font-semibold mb-2">Action Items</h4>
                  <div className="space-y-2">
                    {selected.action_items.map((ai, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs bg-secondary/30 rounded p-2">
                        <CheckCircle2 size={13} className={ai.status === 'done' ? 'text-status-green mt-0.5' : 'text-muted-foreground mt-0.5'} />
                        <div className="flex-1"><p className="font-medium">{ai.text}</p><p className="text-[10px] text-muted-foreground">{ai.owner} · Due {ai.due_date}</p></div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${ai.status === 'done' ? 'bg-status-green/20 text-status-green' : 'bg-secondary text-muted-foreground'}`}>{ai.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border p-10 text-center">
                <ClipboardList size={32} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Select a scorecard to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'meeting' && (
        <div className="bg-card rounded-lg border border-border p-6 max-w-2xl mx-auto space-y-5">
          <div className="text-center border-b border-border pb-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">All American Roof Pros</p>
            <h3 className="text-lg font-bold mt-1">Weekly Marketing Meeting</h3>
            <p className="text-xs text-muted-foreground">{selected ? `${selected.start_date} → ${selected.end_date}` : 'Select a scorecard first'}</p>
          </div>
          {selected ? (
            <>
              <div><h4 className="text-xs font-bold text-status-green flex items-center gap-1"><Trophy size={12} /> WINS</h4>
                <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                  <li>• {selected.metrics.leads} leads generated ({fmt$(selected.metrics.cpl)} CPL)</li>
                  <li>• {fmt$(selected.metrics.revenue)} revenue at {selected.metrics.roas.toFixed(1)}x ROAS</li>
                  <li>• {fmtP(selected.metrics.close_rate)} close rate</li>
                </ul>
              </div>
              <div><h4 className="text-xs font-bold text-status-red flex items-center gap-1"><AlertTriangle size={12} /> LOSSES / CHALLENGES</h4>
                <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                  {selected.grade !== 'green' && <li>• Overall grade: {selected.grade.toUpperCase()} — needs improvement</li>}
                  <li>• Review underperforming channels</li>
                  <li>• Address unmapped lead sources</li>
                </ul>
              </div>
              <div><h4 className="text-xs font-bold text-primary flex items-center gap-1"><MessageSquare size={12} /> DECISIONS NEEDED</h4>
                <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                  <li>• Budget reallocation for next period?</li>
                  <li>• New campaign launches?</li>
                  <li>• Rep performance interventions?</li>
                </ul>
              </div>
              <div><h4 className="text-xs font-bold text-accent flex items-center gap-1"><CheckCircle2 size={12} /> ACTION ITEMS</h4>
                <div className="mt-1 space-y-1">
                  {selected.action_items.map((ai, i) => (
                    <p key={i} className="text-xs text-muted-foreground">• {ai.text} — <span className="font-medium">{ai.owner}</span> by {ai.due_date}</p>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Select a scorecard from the list view to populate meeting agenda</p>
          )}
        </div>
      )}
    </div>
  );
}

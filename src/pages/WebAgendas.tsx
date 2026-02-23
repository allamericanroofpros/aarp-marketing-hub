import { useState } from 'react';
import { getMockData } from '@/data/mockState';
import { fmt$ } from '@/services/metrics';
import { CalendarDays, ExternalLink, CheckCircle2, Circle } from 'lucide-react';

export default function WebAgendas() {
  const data = getMockData();
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<'calendar' | 'brief'>('calendar');
  const agenda = selected ? data.webAgendas.find(a => a.id === selected) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Web Agendas</h2>
        <div className="flex gap-1">
          {(['calendar', 'brief'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
              {v === 'calendar' ? 'Calendar' : 'Sales Brief'}
            </button>
          ))}
        </div>
      </div>

      {view === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-1 space-y-2 max-h-[75vh] overflow-y-auto">
            {data.webAgendas.map(a => (
              <button key={a.id} onClick={() => setSelected(a.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${selected === a.id ? 'bg-primary/10 border-primary/40' : 'bg-card border-border hover:border-primary/20'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays size={12} className="text-primary shrink-0" />
                  <span className="text-[10px] text-muted-foreground">{a.week_start}</span>
                </div>
                <p className="text-xs font-semibold">{a.theme}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{a.target_area} · {a.primary_offer}</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {agenda ? (
              <div className="bg-card rounded-lg border border-border p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold">{agenda.theme}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Week of {agenda.week_start} · {agenda.target_area}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-muted-foreground">Goal:</span> <span className="font-medium">{agenda.goal}</span></div>
                  <div><span className="text-muted-foreground">Offer:</span> <span className="font-medium">{agenda.primary_offer}</span></div>
                  <div className="col-span-2 flex items-center gap-1">
                    <span className="text-muted-foreground">Landing Page:</span>
                    <a href="#" className="text-primary hover:underline flex items-center gap-1">{agenda.landing_page_url} <ExternalLink size={10} /></a>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold mb-1.5">Talking Points</h4>
                  <ul className="space-y-1">
                    {agenda.talking_points.map((tp, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span> {tp}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold mb-1.5">CTAs</h4>
                  <div className="flex gap-2">{agenda.ctas.map(c => <span key={c} className="px-2 py-1 bg-primary/10 text-primary text-[10px] rounded font-medium">{c}</span>)}</div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold mb-1.5">Budget Plan</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(agenda.budget_plan).map(([k, v]) => (
                      <div key={k} className="bg-secondary/50 rounded p-2 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase">{k}</p>
                        <p className="text-xs font-bold">{fmt$(v)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold mb-1.5">KPI Targets</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-secondary/50 rounded p-2 text-center">
                      <p className="text-[10px] text-muted-foreground">Leads</p>
                      <p className="text-xs font-bold">{agenda.kpis.leads_target}</p>
                    </div>
                    <div className="bg-secondary/50 rounded p-2 text-center">
                      <p className="text-[10px] text-muted-foreground">CPL Target</p>
                      <p className="text-xs font-bold">{fmt$(agenda.kpis.cpl_target)}</p>
                    </div>
                    <div className="bg-secondary/50 rounded p-2 text-center">
                      <p className="text-[10px] text-muted-foreground">Revenue</p>
                      <p className="text-xs font-bold">{fmt$(agenda.kpis.revenue_target)}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold mb-1.5">Agenda to Execution</h4>
                  <div className="space-y-1.5">
                    {['Landing page ready', 'Tracking UTMs set', 'Ads live', 'Mail order placed', 'Content scheduled', 'Sales team briefed'].map(item => (
                      <label key={item} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                        <input type="checkbox" className="rounded border-border bg-secondary" />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border p-10 text-center">
                <CalendarDays size={32} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Select an agenda to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'brief' && agenda && (
        <div className="bg-card rounded-lg border border-border p-6 max-w-2xl mx-auto space-y-4 print:shadow-none">
          <div className="text-center border-b border-border pb-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">All American Roof Pros</p>
            <h3 className="text-lg font-bold mt-1">Weekly Sales Brief</h3>
            <p className="text-xs text-muted-foreground">Week of {agenda.week_start}</p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-primary">THIS WEEK'S THEME</h4>
            <p className="text-sm font-semibold mt-1">{agenda.theme}</p>
            <p className="text-xs text-muted-foreground">{agenda.goal}</p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-primary">PRIMARY OFFER</h4>
            <p className="text-sm font-semibold mt-1">{agenda.primary_offer}</p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-primary">TALKING POINTS</h4>
            <ul className="mt-1 space-y-1">{agenda.talking_points.map((t, i) => <li key={i} className="text-xs">• {t}</li>)}</ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-primary">CALL-TO-ACTIONS</h4>
            <p className="text-xs mt-1">{agenda.ctas.join(' | ')}</p>
          </div>
          <div className="text-center pt-4 border-t border-border">
            <p className="text-[10px] text-muted-foreground">Target Area: {agenda.target_area} · Landing: {agenda.landing_page_url}</p>
          </div>
        </div>
      )}

      {view === 'brief' && !agenda && (
        <div className="bg-card rounded-lg border border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">Select an agenda from Calendar view first</p>
        </div>
      )}
    </div>
  );
}

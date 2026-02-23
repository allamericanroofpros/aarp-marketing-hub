import type { MockData } from '../data/types';
import { resolveSource, resolveSpendSource } from './attribution';
import { filterByDateRange } from './metrics';

export interface SourceRollup {
  source_id: string | null;
  name: string;
  type: string;
  spend: number;
  leads: number;
  appointments: number;
  dealsWon: number;
  revenue: number;
  cpl: number;
  cpAppt: number;
  closeRate: number;
  gpEst: number;
  roas: number;
  sessions: number;
}

export interface RepRollup {
  rep_id: string;
  name: string;
  role: string;
  location: string;
  leads: number;
  appointments: number;
  dealsWon: number;
  revenue: number;
  closeRate: number;
  avgDeal: number;
  bestSource: string;
}

export function getFilteredData(data: MockData, startDate: string, endDate: string, locations: string[]) {
  let leads = filterByDateRange(data.leads, 'created_date', startDate, endDate);
  let spend = filterByDateRange(data.spend, 'date', startDate, endDate);
  let sessions = data.sessions.filter(s => {
    const d = s.started_at.split('T')[0];
    return d >= startDate && d <= endDate;
  });
  if (locations.length > 0) {
    leads = leads.filter(l => locations.includes(l.location));
    spend = spend.filter(s => locations.includes(s.location));
    sessions = sessions.filter(s => locations.includes(s.location));
  }
  const leadIds = new Set(leads.map(l => l.id));
  const deals = data.deals.filter(d => leadIds.has(d.lead_id));
  return { leads, deals, spend, sessions };
}

export function rollupBySource(data: MockData, startDate: string, endDate: string, locations: string[]): SourceRollup[] {
  const { leads, deals, spend, sessions } = getFilteredData(data, startDate, endDate, locations);
  const m: Record<string, SourceRollup> = {};

  const ensure = (sid: string | null) => {
    const key = sid || '__unmapped__';
    if (!m[key]) {
      const src = sid ? data.sources.find(s => s.id === sid) : null;
      m[key] = { source_id: sid, name: src?.name || 'Unmapped', type: src?.type || '—', spend: 0, leads: 0, appointments: 0, dealsWon: 0, revenue: 0, cpl: 0, cpAppt: 0, closeRate: 0, gpEst: 0, roas: 0, sessions: 0 };
    }
    return m[key];
  };

  leads.forEach(l => { const sid = resolveSource(l, data.mappingRules); const r = ensure(sid); r.leads++; if (l.appointment_set) r.appointments++; });
  deals.filter(d => d.status === 'won').forEach(d => { const lead = data.leads.find(l => l.id === d.lead_id); const sid = lead ? resolveSource(lead, data.mappingRules) : null; const r = ensure(sid); r.dealsWon++; r.revenue += d.revenue; });
  spend.forEach(s => { const sid = resolveSpendSource(s, data.mappingRules); ensure(sid).spend += s.amount; });
  sessions.forEach(s => { const sid = resolveSource(s as any, data.mappingRules); ensure(sid).sessions++; });

  return Object.values(m).map(r => ({
    ...r,
    cpl: r.leads > 0 ? r.spend / r.leads : 0,
    cpAppt: r.appointments > 0 ? r.spend / r.appointments : 0,
    closeRate: r.leads > 0 ? r.dealsWon / r.leads : 0,
    gpEst: r.revenue * 0.48,
    roas: r.spend > 0 ? r.revenue / r.spend : 0,
  }));
}

export function rollupByRep(data: MockData, startDate: string, endDate: string, locations: string[]): RepRollup[] {
  const { leads, deals } = getFilteredData(data, startDate, endDate, locations);
  const m: Record<string, RepRollup & { sourceCounts: Record<string, number> }> = {};

  data.reps.forEach(rep => {
    m[rep.id] = { rep_id: rep.id, name: rep.name, role: rep.role, location: '', leads: 0, appointments: 0, dealsWon: 0, revenue: 0, closeRate: 0, avgDeal: 0, bestSource: '—', sourceCounts: {} };
  });

  leads.forEach(l => {
    if (!m[l.rep]) return;
    m[l.rep].leads++;
    m[l.rep].location = l.location;
    if (l.appointment_set) m[l.rep].appointments++;
    const sid = resolveSource(l, data.mappingRules);
    const sname = sid ? (data.sources.find(s => s.id === sid)?.name || '?') : 'Unmapped';
    m[l.rep].sourceCounts[sname] = (m[l.rep].sourceCounts[sname] || 0) + 1;
  });

  deals.filter(d => d.status === 'won').forEach(d => {
    if (!m[d.rep]) return;
    m[d.rep].dealsWon++;
    m[d.rep].revenue += d.revenue;
  });

  return Object.values(m).map(r => {
    const bestSrc = Object.entries(r.sourceCounts).sort((a, b) => b[1] - a[1])[0];
    return {
      rep_id: r.rep_id, name: r.name, role: r.role, location: r.location,
      leads: r.leads, appointments: r.appointments, dealsWon: r.dealsWon, revenue: r.revenue,
      closeRate: r.leads > 0 ? r.dealsWon / r.leads : 0,
      avgDeal: r.dealsWon > 0 ? r.revenue / r.dealsWon : 0,
      bestSource: bestSrc ? bestSrc[0] : '—',
    };
  });
}

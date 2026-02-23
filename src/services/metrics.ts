import type { Lead, Deal, SpendDaily } from '../data/types';

export interface KPIs {
  spend: number;
  leads: number;
  cpl: number;
  appointments: number;
  costPerAppointment: number;
  dealsWon: number;
  closeRate: number;
  revenue: number;
  avgDealSize: number;
  grossProfit: number;
  roas: number;
}

export function computeKpis(leads: Lead[], deals: Deal[], spend: SpendDaily[]): KPIs {
  const totalSpend = spend.reduce((s, x) => s + x.amount, 0);
  const totalLeads = leads.length;
  const appointments = leads.filter(l => l.appointment_set).length;
  const wonDeals = deals.filter(d => d.status === 'won');
  const totalRevenue = wonDeals.reduce((s, d) => s + d.revenue, 0);
  return {
    spend: totalSpend,
    leads: totalLeads,
    cpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
    appointments,
    costPerAppointment: appointments > 0 ? totalSpend / appointments : 0,
    dealsWon: wonDeals.length,
    closeRate: totalLeads > 0 ? wonDeals.length / totalLeads : 0,
    revenue: totalRevenue,
    avgDealSize: wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0,
    grossProfit: totalRevenue * 0.48,
    roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
  };
}

export function computeDeltas(current: KPIs, previous: KPIs): Record<keyof KPIs, number> {
  const d = {} as Record<keyof KPIs, number>;
  for (const key of Object.keys(current) as (keyof KPIs)[]) {
    const prev = previous[key] || 0;
    d[key] = prev !== 0 ? ((current[key] - prev) / Math.abs(prev)) * 100 : (current[key] > 0 ? 100 : 0);
  }
  return d;
}

export function filterByDateRange<T extends Record<string, any>>(items: T[], dateField: string, start: string, end: string): T[] {
  return items.filter(item => item[dateField] >= start && item[dateField] <= end);
}

export const fmt$ = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
export const fmtN = (n: number) => new Intl.NumberFormat('en-US').format(Math.round(n));
export const fmtP = (n: number) => (n * 100).toFixed(1) + '%';

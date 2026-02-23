import type { MockData, WebEvent, VideoEvent, Session } from '../data/types';

export interface FunnelStep {
  label: string;
  count: number;
  pct: number;
  dropoff: number;
}

export function computeFunnel(data: MockData, startDate: string, endDate: string, locations: string[]): FunnelStep[] {
  const sessions = data.sessions.filter(s => {
    const d = s.started_at.split('T')[0];
    return d >= startDate && d <= endDate && (locations.length === 0 || locations.includes(s.location));
  });
  const sessIds = new Set(sessions.map(s => s.id));
  const events = data.events.filter(e => sessIds.has(e.session_id));

  const landing = sessions.length;
  const formStart = new Set(events.filter(e => e.name === 'form_start').map(e => e.session_id)).size;
  const formSubmit = new Set(events.filter(e => e.name === 'form_submit').map(e => e.session_id)).size;

  // Appointments from leads
  const contactIds = new Set(sessions.filter(s => s.contact_id).map(s => s.contact_id));
  const matchedLeads = data.leads.filter(l => l.contact_id && contactIds.has(l.contact_id));
  const appointments = matchedLeads.filter(l => l.appointment_set).length;
  const won = data.deals.filter(d => d.status === 'won' && matchedLeads.some(l => l.id === d.lead_id)).length;

  const steps = [
    { label: 'Landing Page', count: landing },
    { label: 'Form Start', count: formStart },
    { label: 'Form Submit', count: formSubmit },
    { label: 'Appointment', count: appointments },
    { label: 'Won Deal', count: won },
  ];

  return steps.map((s, i) => ({
    ...s,
    pct: landing > 0 ? (s.count / landing) * 100 : 0,
    dropoff: i > 0 ? (steps[i - 1].count > 0 ? ((steps[i - 1].count - s.count) / steps[i - 1].count) * 100 : 0) : 0,
  }));
}

export interface PageMetric {
  url: string;
  views: number;
  exits: number;
  formStarts: number;
  formSubmits: number;
  cvr: number;
}

export function getTopPages(data: MockData, startDate: string, endDate: string, locations: string[]): PageMetric[] {
  const sessions = data.sessions.filter(s => {
    const d = s.started_at.split('T')[0];
    return d >= startDate && d <= endDate && (locations.length === 0 || locations.includes(s.location));
  });
  const sessIds = new Set(sessions.map(s => s.id));
  const events = data.events.filter(e => sessIds.has(e.session_id));

  const m: Record<string, PageMetric> = {};
  events.forEach(e => {
    const url = e.props.url || (e.name === 'form_start' || e.name === 'form_submit' ? '/form-page' : null);
    if (!url) return;
    if (!m[url]) m[url] = { url, views: 0, exits: 0, formStarts: 0, formSubmits: 0, cvr: 0 };
    if (e.name === 'page_view') m[url].views++;
    if (e.name === 'exit') m[url].exits++;
    if (e.name === 'form_start') m[url].formStarts++;
    if (e.name === 'form_submit') m[url].formSubmits++;
  });

  return Object.values(m).map(p => ({
    ...p,
    cvr: p.views > 0 ? (p.formSubmits / p.views) * 100 : 0,
  })).sort((a, b) => b.views - a.views);
}

export interface VideoLeaderboard {
  video_id: string;
  title: string;
  plays: number;
  avgWatchPct: number;
  completionRate: number;
  influencedLeads: number;
  influencedRevenue: number;
}

export function getVideoLeaderboard(data: MockData, startDate: string, endDate: string): VideoLeaderboard[] {
  const vEvents = data.videoEvents.filter(e => {
    const d = e.ts.split('T')[0];
    return d >= startDate && d <= endDate;
  });

  const m: Record<string, { plays: number; completes: number; progPcts: number[]; contactIds: Set<string> }> = {};
  data.videos.forEach(v => { m[v.id] = { plays: 0, completes: 0, progPcts: [], contactIds: new Set() }; });

  vEvents.forEach(e => {
    if (!m[e.video_id]) return;
    if (e.name === 'play') m[e.video_id].plays++;
    if (e.name === 'complete') m[e.video_id].completes++;
    if (e.name === 'progress' && e.props.percent) m[e.video_id].progPcts.push(e.props.percent);
    if (e.contact_id) m[e.video_id].contactIds.add(e.contact_id);
  });

  const wonDeals = data.deals.filter(d => d.status === 'won');
  const leadContactMap = new Map(data.leads.filter(l => l.contact_id).map(l => [l.contact_id!, l.id]));

  return data.videos.map(v => {
    const s = m[v.id];
    const allPcts = [...s.progPcts];
    if (allPcts.length === 0) allPcts.push(0);
    const influencedLeadIds = new Set<string>();
    let influencedRev = 0;
    s.contactIds.forEach(cid => {
      const lid = leadContactMap.get(cid);
      if (lid) {
        influencedLeadIds.add(lid);
        const deal = wonDeals.find(d => d.lead_id === lid);
        if (deal) influencedRev += deal.revenue;
      }
    });
    return {
      video_id: v.id,
      title: v.title,
      plays: s.plays,
      avgWatchPct: allPcts.reduce((a, b) => a + b, 0) / allPcts.length,
      completionRate: s.plays > 0 ? (s.completes / s.plays) * 100 : 0,
      influencedLeads: influencedLeadIds.size,
      influencedRevenue: influencedRev,
    };
  }).sort((a, b) => b.plays - a.plays);
}

export interface AttritionMilestone {
  percent: number;
  count: number;
  pct: number;
}

export function getVideoAttrition(data: MockData, videoId?: string): AttritionMilestone[] {
  const relevant = videoId ? data.videoEvents.filter(e => e.video_id === videoId) : data.videoEvents;
  const plays = relevant.filter(e => e.name === 'play').length || 1;
  const milestones = [25, 50, 75, 90, 100] as const;

  return milestones.map(pct => {
    const count = relevant.filter(e => (e.name === 'progress' || e.name === 'complete') && e.props.percent && e.props.percent >= pct).length;
    return { percent: pct, count, pct: (count / plays) * 100 };
  });
}

export interface InfluencedConversion {
  contact_name: string;
  video_title: string;
  percent_watched: number;
  days_to_convert: number;
  deal_revenue: number;
}

export function getInfluencedConversions(data: MockData, limit = 20): InfluencedConversion[] {
  const wonDeals = data.deals.filter(d => d.status === 'won');
  const results: InfluencedConversion[] = [];

  for (const deal of wonDeals) {
    const lead = data.leads.find(l => l.id === deal.lead_id);
    if (!lead?.contact_id) continue;
    const contact = data.contacts.find(c => c.id === lead.contact_id);
    if (!contact) continue;

    const vEvts = data.videoEvents.filter(e => e.contact_id === lead.contact_id);
    if (vEvts.length === 0) continue;

    const maxEvt = vEvts.reduce((best, e) => {
      const pct = e.props.percent || 0;
      return pct > (best.props.percent || 0) ? e : best;
    }, vEvts[0]);

    const video = data.videos.find(v => v.id === maxEvt.video_id);
    if (!video) continue;

    results.push({
      contact_name: contact.name || 'Anonymous',
      video_title: video.title,
      percent_watched: maxEvt.props.percent || 0,
      days_to_convert: deal.days_to_close,
      deal_revenue: deal.revenue,
    });

    if (results.length >= limit) break;
  }

  return results;
}

export interface AnalyticsKPIs {
  sessions: number;
  pageviews: number;
  uniqueVisitors: number;
  formStarts: number;
  formSubmits: number;
  cvr: number;
  avgTimeOnPage: number;
}

export function getAnalyticsKPIs(data: MockData, startDate: string, endDate: string, locations: string[]): AnalyticsKPIs {
  const sessions = data.sessions.filter(s => {
    const d = s.started_at.split('T')[0];
    return d >= startDate && d <= endDate && (locations.length === 0 || locations.includes(s.location));
  });
  const sessIds = new Set(sessions.map(s => s.id));
  const events = data.events.filter(e => sessIds.has(e.session_id));

  const pageviews = events.filter(e => e.name === 'page_view').length;
  const uniqueVisitors = new Set(sessions.map(s => s.anonymous_id)).size;
  const formStarts = events.filter(e => e.name === 'form_start').length;
  const formSubmits = events.filter(e => e.name === 'form_submit').length;
  const topEvents = events.filter(e => e.name === 'time_on_page' && e.props.duration_sec);
  const avgTime = topEvents.length > 0 ? topEvents.reduce((s, e) => s + (e.props.duration_sec || 0), 0) / topEvents.length : 0;

  return {
    sessions: sessions.length,
    pageviews,
    uniqueVisitors,
    formStarts,
    formSubmits,
    cvr: sessions.length > 0 ? (formSubmits / sessions.length) * 100 : 0,
    avgTimeOnPage: Math.round(avgTime),
  };
}

export interface UTMPerformance {
  utm_campaign: string;
  sessions: number;
  submits: number;
  deals: number;
  revenue: number;
}

export function getUTMPerformance(data: MockData, startDate: string, endDate: string, locations: string[]): UTMPerformance[] {
  const sessions = data.sessions.filter(s => {
    const d = s.started_at.split('T')[0];
    return d >= startDate && d <= endDate && (locations.length === 0 || locations.includes(s.location));
  });
  const sessIds = new Set(sessions.map(s => s.id));
  const events = data.events.filter(e => sessIds.has(e.session_id));

  const m: Record<string, UTMPerformance> = {};
  sessions.forEach(s => {
    const key = s.utm_campaign || '(none)';
    if (!m[key]) m[key] = { utm_campaign: key, sessions: 0, submits: 0, deals: 0, revenue: 0 };
    m[key].sessions++;
  });

  const submitBySess: Record<string, boolean> = {};
  events.filter(e => e.name === 'form_submit').forEach(e => { submitBySess[e.session_id] = true; });

  sessions.forEach(s => {
    const key = s.utm_campaign || '(none)';
    if (submitBySess[s.id]) m[key].submits++;
  });

  // Match deals through contacts
  const wonDeals = data.deals.filter(d => d.status === 'won');
  const sessContactMap = new Map<string, string[]>();
  sessions.filter(s => s.contact_id).forEach(s => {
    const arr = sessContactMap.get(s.contact_id!) || [];
    arr.push(s.utm_campaign || '(none)');
    sessContactMap.set(s.contact_id!, arr);
  });

  wonDeals.forEach(d => {
    const lead = data.leads.find(l => l.id === d.lead_id);
    if (!lead?.contact_id) return;
    const utms = sessContactMap.get(lead.contact_id);
    if (!utms || utms.length === 0) return;
    const key = utms[0];
    if (m[key]) { m[key].deals++; m[key].revenue += d.revenue; }
  });

  return Object.values(m).sort((a, b) => b.sessions - a.sessions);
}

import { db } from './db';
import { cache } from './cache';
import { createJob, delay } from './jobs';
import { resolveSource, resolveSpendSource, getUnmappedLeads, getUnmappedSpend, getUnmappedSessions } from '@/services/attribution';
import { computeKpis, computeDeltas, filterByDateRange } from '@/services/metrics';
import { rollupBySource, rollupByRep } from '@/services/rollups';
import {
  getAnalyticsKPIs, computeFunnel, getTopPages, getUTMPerformance,
  getVideoLeaderboard, getVideoAttrition, getInfluencedConversions,
} from '@/services/analytics';
import { fmt$, fmtP } from '@/lib/format';
import { subDays, format } from 'date-fns';
import type { MappingRule } from '@/data/types';

export interface Filters {
  startDate: string;
  endDate: string;
  locations: string[];
  sourceFilter?: string;
  repFilter?: string;
  statusFilter?: string;
}

function filteredLeadsDealsSpend(f: Filters) {
  const data = db.getData();
  let leads = filterByDateRange(data.leads, 'created_date', f.startDate, f.endDate);
  let spend = filterByDateRange(data.spend, 'date', f.startDate, f.endDate);
  if (f.locations.length > 0) {
    leads = leads.filter(l => f.locations.includes(l.location));
    spend = spend.filter(s => f.locations.includes(s.location));
  }
  const leadIds = new Set(leads.map(l => l.id));
  const deals = data.deals.filter(d => leadIds.has(d.lead_id));
  return { leads, deals, spend, data };
}

export const mockServer = {
  /* ── Home ── */
  getHomeData(f: Filters) {
    const ck = 'homeData';
    const cached = cache.get(ck, f);
    if (cached) return cached;

    const { leads, deals, spend, data } = filteredLeadsDealsSpend(f);
    const kpis = computeKpis(leads, deals, spend);

    // Previous period
    const days = Math.max(1, Math.round((new Date(f.endDate).getTime() - new Date(f.startDate).getTime()) / 86400000));
    const pEnd = format(subDays(new Date(f.startDate), 1), 'yyyy-MM-dd');
    const pStart = format(subDays(new Date(f.startDate), days), 'yyyy-MM-dd');
    let pLeads = filterByDateRange(data.leads, 'created_date', pStart, pEnd);
    let pSpend = filterByDateRange(data.spend, 'date', pStart, pEnd);
    if (f.locations.length > 0) {
      pLeads = pLeads.filter(l => f.locations.includes(l.location));
      pSpend = pSpend.filter(s => f.locations.includes(s.location));
    }
    const pIds = new Set(pLeads.map(l => l.id));
    const pDeals = data.deals.filter(d => pIds.has(d.lead_id));
    const prevKpis = computeKpis(pLeads, pDeals, pSpend);
    const deltas = computeDeltas(kpis, prevKpis);

    // Trend
    const dayMap: Record<string, { date: string; spend: number; revenue: number }> = {};
    spend.forEach(s => {
      if (!dayMap[s.date]) dayMap[s.date] = { date: s.date, spend: 0, revenue: 0 };
      dayMap[s.date].spend += s.amount;
    });
    deals.filter(d => d.status === 'won').forEach(d => {
      if (!dayMap[d.close_date]) dayMap[d.close_date] = { date: d.close_date, spend: 0, revenue: 0 };
      dayMap[d.close_date].revenue += d.revenue;
    });
    const trendData = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

    // Top sources
    const srcMap: Record<string, { name: string; spend: number; leads: number; revenue: number }> = {};
    leads.forEach(lead => {
      const sid = resolveSource(lead, data.mappingRules);
      const name = sid ? (data.sources.find(s => s.id === sid)?.name || 'Unknown') : 'Unmapped';
      if (!srcMap[name]) srcMap[name] = { name, spend: 0, leads: 0, revenue: 0 };
      srcMap[name].leads++;
    });
    deals.filter(d => d.status === 'won').forEach(deal => {
      const lead = data.leads.find(l => l.id === deal.lead_id);
      if (!lead) return;
      const sid = resolveSource(lead, data.mappingRules);
      const name = sid ? (data.sources.find(s => s.id === sid)?.name || 'Unknown') : 'Unmapped';
      if (!srcMap[name]) srcMap[name] = { name, spend: 0, leads: 0, revenue: 0 };
      srcMap[name].revenue += deal.revenue;
    });
    spend.forEach(s => {
      const name = s.campaign_name.includes('google-search') ? 'PPC – Google Search'
        : s.campaign_name.includes('lsa') ? 'PPC – Google LSA'
        : s.campaign_name.includes('fb') ? 'PPC – Facebook'
        : s.campaign_name.includes('eddm') ? 'Direct Mail – EDDM Feb 2026'
        : s.campaign_name.includes('targeted') ? 'Direct Mail – Targeted Mail' : 'Other';
      if (!srcMap[name]) srcMap[name] = { name, spend: 0, leads: 0, revenue: 0 };
      srcMap[name].spend += s.amount;
    });
    const topSources = Object.values(srcMap)
      .map(s => ({ ...s, roas: s.spend > 0 ? s.revenue / s.spend : 0, cpl: s.leads > 0 ? s.spend / s.leads : 0 }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Alerts
    const alerts: { type: string; text: string }[] = [];
    const unmapped = leads.filter(l => resolveSource(l, data.mappingRules) === null);
    if (unmapped.length > 5) alerts.push({ type: 'warning', text: `${unmapped.length} unmapped leads need source attribution` });
    if (kpis.cpl > 100) alerts.push({ type: 'danger', text: `CPL is ${fmt$(kpis.cpl)} — review underperforming channels` });
    topSources.forEach(s => {
      if (s.spend > 500 && s.roas < 2) alerts.push({ type: 'warning', text: `${s.name}: low ROAS (${s.roas.toFixed(1)}x) on ${fmt$(s.spend)} spend` });
    });
    if (kpis.closeRate < 0.15) alerts.push({ type: 'info', text: `Close rate ${fmtP(kpis.closeRate)} — consider rep coaching` });

    const result = { kpis, deltas, trendData, topSources, alerts: alerts.slice(0, 5) };
    cache.set(ck, result, f);
    return result;
  },

  /* ── Performance ── */
  getRollupBySource(f: Filters) {
    const ck = 'rollupBySource';
    const cached = cache.get(ck, f);
    if (cached) return cached;
    const result = rollupBySource(db.getData(), f.startDate, f.endDate, f.locations);
    cache.set(ck, result, f);
    return result;
  },
  getRollupByRep(f: Filters) {
    const ck = 'rollupByRep';
    const cached = cache.get(ck, f);
    if (cached) return cached;
    const result = rollupByRep(db.getData(), f.startDate, f.endDate, f.locations);
    cache.set(ck, result, f);
    return result;
  },

  /* ── Pipeline ── */
  getLeads(f: Filters) {
    const data = db.getData();
    let leads = filterByDateRange(data.leads, 'created_date', f.startDate, f.endDate);
    if (f.locations.length > 0) leads = leads.filter(l => f.locations.includes(l.location));
    if (f.sourceFilter) leads = leads.filter(l => resolveSource(l, data.mappingRules) === f.sourceFilter);
    if (f.repFilter) leads = leads.filter(l => l.rep === f.repFilter);
    if (f.statusFilter && f.statusFilter !== 'all') leads = leads.filter(l => l.status === f.statusFilter);
    return leads.map(l => {
      const sid = resolveSource(l, data.mappingRules);
      return {
        ...l,
        sourceName: sid ? (data.sources.find(s => s.id === sid)?.name || '?') : 'Unmapped',
        repName: data.reps.find(r => r.id === l.rep)?.name || l.rep,
      };
    });
  },
  getDeals(f: Filters) {
    const data = db.getData();
    let leads = filterByDateRange(data.leads, 'created_date', f.startDate, f.endDate);
    if (f.locations.length > 0) leads = leads.filter(l => f.locations.includes(l.location));
    if (f.sourceFilter) leads = leads.filter(l => resolveSource(l, data.mappingRules) === f.sourceFilter);
    if (f.repFilter) leads = leads.filter(l => l.rep === f.repFilter);
    const leadIds = new Set(leads.map(l => l.id));
    let deals = data.deals.filter(d => leadIds.has(d.lead_id));
    if (f.statusFilter && f.statusFilter !== 'all') deals = deals.filter(d => d.status === f.statusFilter);
    return deals.map(d => {
      const lead = data.leads.find(l => l.id === d.lead_id);
      const sid = lead ? resolveSource(lead, data.mappingRules) : null;
      return {
        ...d,
        sourceName: sid ? (data.sources.find(s => s.id === sid)?.name || '?') : 'Unmapped',
        repName: data.reps.find(r => r.id === d.rep)?.name || d.rep,
        leadContactId: lead?.contact_id,
      };
    });
  },
  getContactTimeline(contactId: string) {
    const data = db.getData();
    const contact = data.contacts.find(c => c.id === contactId);
    if (!contact) return null;

    const sessions = data.sessions.filter(s => s.contact_id === contactId);
    const events = data.events.filter(e => e.contact_id === contactId);
    const vEvents = data.videoEvents.filter(e => e.contact_id === contactId);
    const cLeads = data.leads.filter(l => l.contact_id === contactId);
    const dealLeadIds = new Set(cLeads.map(l => l.id));
    const cDeals = data.deals.filter(d => dealLeadIds.has(d.lead_id));

    type TItem = { ts: string; type: string; label: string; detail: string };
    const items: TItem[] = [];
    sessions.forEach(s => items.push({ ts: s.started_at, type: 'session', label: 'Session', detail: `${s.landing_page} via ${s.utm_source}/${s.utm_medium} (${s.device})` }));
    events.filter(e => e.name === 'page_view').forEach(e => items.push({ ts: e.ts, type: 'pageview', label: 'Page View', detail: e.props.url || '' }));
    events.filter(e => e.name === 'form_submit').forEach(e => items.push({ ts: e.ts, type: 'form', label: 'Form Submit', detail: e.props.form_id || '' }));
    events.filter(e => e.name === 'form_start').forEach(e => items.push({ ts: e.ts, type: 'form_start', label: 'Form Start', detail: e.props.form_id || '' }));
    vEvents.filter(e => e.name === 'play' || e.name === 'complete').forEach(e => {
      const vid = data.videos.find(v => v.id === e.video_id);
      items.push({ ts: e.ts, type: 'video', label: e.name === 'play' ? 'Video Play' : 'Video Complete', detail: vid?.title || e.video_id });
    });
    cLeads.forEach(l => items.push({ ts: l.created_date + 'T00:00:00Z', type: 'lead', label: 'Lead Created', detail: `${l.lead_type} — ${l.status}` }));
    cDeals.forEach(d => items.push({ ts: d.close_date + 'T00:00:00Z', type: 'deal', label: d.status === 'won' ? 'Deal Won' : 'Deal Lost', detail: d.status === 'won' ? fmt$(d.revenue) : '' }));
    items.sort((a, b) => b.ts.localeCompare(a.ts));

    const firstTouchSrc = contact.first_touch_source_id ? data.sources.find(s => s.id === contact.first_touch_source_id)?.name || null : null;
    const lastTouchSrc = contact.last_touch_source_id ? data.sources.find(s => s.id === contact.last_touch_source_id)?.name || null : null;

    return {
      contact, items,
      firstTouchSrc, lastTouchSrc,
      videosWatched: new Set(vEvents.map(e => e.video_id)).size,
      pagesVisited: new Set(events.filter(e => e.name === 'page_view').map(e => e.props.url)).size,
      sessions: sessions.length,
    };
  },

  /* ── Analytics ── */
  getAnalyticsKPIs(f: Filters) {
    const ck = 'analyticsKPIs';
    const cached = cache.get(ck, f);
    if (cached) return cached;
    const result = getAnalyticsKPIs(db.getData(), f.startDate, f.endDate, f.locations);
    cache.set(ck, result, f);
    return result;
  },
  getFunnel(f: Filters) {
    const ck = 'funnel';
    const cached = cache.get(ck, f);
    if (cached) return cached;
    const result = computeFunnel(db.getData(), f.startDate, f.endDate, f.locations);
    cache.set(ck, result, f);
    return result;
  },
  getTopPages(f: Filters) { return getTopPages(db.getData(), f.startDate, f.endDate, f.locations); },
  getUTMPerformance(f: Filters) { return getUTMPerformance(db.getData(), f.startDate, f.endDate, f.locations); },

  /* ── Video ── */
  getVideoLeaderboard(f: { startDate: string; endDate: string }) {
    const ck = 'videoLeaderboard';
    const cached = cache.get(ck, f);
    if (cached) return cached;
    const result = getVideoLeaderboard(db.getData(), f.startDate, f.endDate);
    cache.set(ck, result, f);
    return result;
  },
  getVideoAttrition(videoId?: string) { return getVideoAttrition(db.getData(), videoId); },
  getInfluencedConversions(limit?: number) { return getInfluencedConversions(db.getData(), limit); },

  /* ── Static entities ── */
  getContentAssets() { return db.getData().contentAssets; },
  getWebAgendas() { return db.getData().webAgendas; },
  getScorecards() { return db.getData().scorecards; },
  getConnectors() { return db.getData().connectors; },
  getSources() { return db.getData().sources; },
  getReps() { return db.getData().reps; },
  getMappingRules() { return db.getData().mappingRules; },

  /* ── Mutations ── */
  createMappingRule(rule: MappingRule) {
    const data = db.getData();
    data.mappingRules.push(rule);
    db.setData({ ...data });
    cache.invalidateAll();
    return rule;
  },

  /* ── Connectors ── */
  getSyncLogs(connectorId?: string) { return db.getSyncLogs(connectorId); },
  runConnectorSync(connectorId: string) {
    const data = db.getData();
    const connector = data.connectors.find(c => c.id === connectorId);
    if (!connector) throw new Error('Connector not found');
    const job = createJob(`sync:${connector.name}`, async (progress) => {
      progress(10, `Authenticating with ${connector.name}...`);
      await delay(500);
      progress(30, 'Fetching data...');
      await delay(700);
      progress(60, 'Processing records...');
      await delay(500);
      progress(80, 'Updating database...');
      const d = db.getData();
      const c = d.connectors.find(x => x.id === connectorId);
      if (c) {
        c.status = 'connected';
        c.last_sync = new Date().toISOString();
        c.health_message = 'Last sync successful';
        db.setData({ ...d });
      }
      db.addSyncLog({
        id: `sl-${Date.now()}`,
        connector_id: connectorId,
        timestamp: new Date().toISOString(),
        status: 'success',
        message: `Synced successfully from ${connector.name}`,
        imported: { leads: Math.floor(Math.random() * 15) + 1, spend: Math.floor(Math.random() * 5), sessions: Math.floor(Math.random() * 50) },
      });
      await delay(300);
      progress(100, 'Sync complete');
      cache.invalidateAll();
    });
    return job;
  },

  /* ── Unmapped ── */
  getUnmappedLeads(f: Filters) {
    const data = db.getData();
    const leads = filterByDateRange(data.leads, 'created_date', f.startDate, f.endDate);
    return getUnmappedLeads(leads, data.mappingRules);
  },
  getUnmappedSpend(f: Filters) {
    const data = db.getData();
    const spend = filterByDateRange(data.spend, 'date', f.startDate, f.endDate);
    return getUnmappedSpend(spend, data.mappingRules);
  },
  getUnmappedSessions(f: Filters) {
    const data = db.getData();
    const sessions = data.sessions.filter(s => {
      const d = s.started_at.split('T')[0];
      return d >= f.startDate && d <= f.endDate;
    });
    return getUnmappedSessions(sessions, data.mappingRules);
  },

  /* ── Assistant ── */
  getAssistantContext(f: Filters) {
    const { leads, deals, spend } = filteredLeadsDealsSpend(f);
    const data = db.getData();
    const kpis = computeKpis(leads, deals, spend);
    const unmappedCount = leads.filter(l => resolveSource(l, data.mappingRules) === null).length;
    return { kpis, unmappedCount, wonDealsCount: deals.filter(d => d.status === 'won').length, totalSpendEntries: spend.length };
  },

  /* ── Ingestion ── */
  ingestEvent(payload: any) {
    const data = db.getData();
    const now = new Date().toISOString();
    const ts = payload.ts || now;
    const anonId = payload.anonymous_id || 'unknown';
    const dayKey = ts.split('T')[0];

    // Ensure a session exists for this anonymous_id + day
    let sessionId = payload.session_id;
    if (!sessionId) {
      const existing = data.sessions.find(
        s => s.anonymous_id === anonId && s.started_at.split('T')[0] === dayKey
      );
      if (existing) {
        sessionId = existing.id;
        existing.ended_at = ts; // update last activity
      } else {
        sessionId = `sess-rt-${Date.now()}`;
        data.sessions.push({
          id: sessionId,
          started_at: ts,
          ended_at: ts,
          anonymous_id: anonId,
          contact_id: payload.contact_id,
          landing_page: payload.props?.url || '/',
          referrer: '',
          utm_source: '',
          utm_medium: '',
          utm_campaign: '',
          device: 'desktop',
          location: 'Mansfield',
        });
      }
    }

    const event: any = {
      id: `ev-rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ts,
      session_id: sessionId,
      anonymous_id: anonId,
      contact_id: payload.contact_id,
      name: payload.name,
      props: payload.props || {},
    };
    data.events.push(event);
    db.setData({ ...data });

    cache.invalidate('analyticsKPIs');
    cache.invalidate('funnel');
    cache.invalidate('homeData');
    return { ok: true, eventId: event.id, sessionId };
  },

  ingestVideoEvent(payload: any) {
    const data = db.getData();
    const ts = payload.ts || new Date().toISOString();
    const anonId = payload.anonymous_id || 'unknown';

    // Ensure session
    let sessionId = payload.session_id;
    if (!sessionId) {
      const dayKey = ts.split('T')[0];
      const existing = data.sessions.find(
        s => s.anonymous_id === anonId && s.started_at.split('T')[0] === dayKey
      );
      sessionId = existing?.id || `sess-rt-${Date.now()}`;
    }

    const ve: any = {
      id: `ve-rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ts,
      video_id: payload.video_id,
      session_id: sessionId,
      anonymous_id: anonId,
      contact_id: payload.contact_id,
      name: payload.name,
      props: payload.props || {},
    };
    data.videoEvents.push(ve);
    db.setData({ ...data });

    cache.invalidate('videoLeaderboard');
    return { ok: true, eventId: ve.id };
  },

  identifyContact(payload: { anonymous_id: string; contact_id: string; email?: string; phone?: string; name?: string }) {
    const data = db.getData();
    let contact = data.contacts.find(c => c.id === payload.contact_id);
    const now = new Date().toISOString();
    if (!contact) {
      contact = {
        id: payload.contact_id,
        created_at: now,
        email: payload.email,
        phone: payload.phone,
        name: payload.name,
        first_seen_at: now,
        last_seen_at: now,
        lifecycle_stage: 'lead',
      };
      data.contacts.push(contact);
    } else {
      if (payload.email) contact.email = payload.email;
      if (payload.phone) contact.phone = payload.phone;
      if (payload.name) contact.name = payload.name;
      contact.last_seen_at = now;
    }
    // Stitch contact_id onto sessions, events, and videoEvents
    data.sessions.forEach(s => {
      if (s.anonymous_id === payload.anonymous_id && !s.contact_id) s.contact_id = payload.contact_id;
    });
    data.events.forEach(e => {
      if (e.anonymous_id === payload.anonymous_id && !e.contact_id) e.contact_id = payload.contact_id;
    });
    data.videoEvents.forEach(v => {
      if (v.anonymous_id === payload.anonymous_id && !v.contact_id) v.contact_id = payload.contact_id;
    });
    db.setData({ ...data });
    cache.invalidateAll();
    return contact;
  },

  /* ── System ── */
  resetData() { db.reset(); cache.invalidateAll(); },
  getSystemHealth() {
    return {
      db: db.getStats(),
      cache: cache.getStatus(),
      connectors: db.getData().connectors.map(c => ({ name: c.name, status: c.status })),
    };
  },
};

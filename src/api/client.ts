import { mockServer, type Filters } from './mockServer';
import type { MappingRule } from '@/data/types';

interface ApiConfig {
  latencyMin: number;
  latencyMax: number;
  failRate: number;
  enabled: boolean;
}

const config: ApiConfig = { latencyMin: 200, latencyMax: 700, failRate: 0.03, enabled: true };

async function simulate<T>(fn: () => T): Promise<T> {
  if (config.enabled) {
    const ms = config.latencyMin + Math.random() * (config.latencyMax - config.latencyMin);
    await new Promise(r => setTimeout(r, ms));
    if (Math.random() < config.failRate) throw new Error('Transient API error — please retry');
  }
  return fn();
}

export type { Filters };

export const api = {
  configure: (opts: Partial<ApiConfig>) => Object.assign(config, opts),

  // Home
  getHomeData: (f: Filters) => simulate(() => mockServer.getHomeData(f)),

  // Performance
  getRollupBySource: (f: Filters) => simulate(() => mockServer.getRollupBySource(f)),
  getRollupByRep: (f: Filters) => simulate(() => mockServer.getRollupByRep(f)),

  // Pipeline
  getLeads: (f: Filters) => simulate(() => mockServer.getLeads(f)),
  getDeals: (f: Filters) => simulate(() => mockServer.getDeals(f)),
  getContactTimeline: (contactId: string) => simulate(() => mockServer.getContactTimeline(contactId)),

  // Analytics
  getAnalyticsKPIs: (f: Filters) => simulate(() => mockServer.getAnalyticsKPIs(f)),
  getFunnel: (f: Filters) => simulate(() => mockServer.getFunnel(f)),
  getTopPages: (f: Filters) => simulate(() => mockServer.getTopPages(f)),
  getUTMPerformance: (f: Filters) => simulate(() => mockServer.getUTMPerformance(f)),

  // Video
  getVideoLeaderboard: (f: { startDate: string; endDate: string }) => simulate(() => mockServer.getVideoLeaderboard(f)),
  getVideoAttrition: (videoId?: string) => simulate(() => mockServer.getVideoAttrition(videoId)),
  getInfluencedConversions: (limit?: number) => simulate(() => mockServer.getInfluencedConversions(limit)),

  // Entities
  getContentAssets: () => simulate(() => mockServer.getContentAssets()),
  getWebAgendas: () => simulate(() => mockServer.getWebAgendas()),
  getScorecards: () => simulate(() => mockServer.getScorecards()),
  getConnectors: () => simulate(() => mockServer.getConnectors()),
  getSources: () => simulate(() => mockServer.getSources()),
  getReps: () => simulate(() => mockServer.getReps()),
  getMappingRules: () => simulate(() => mockServer.getMappingRules()),

  // Mutations
  createMappingRule: (rule: MappingRule) => simulate(() => mockServer.createMappingRule(rule)),
  runConnectorSync: (connectorId: string) => simulate(() => mockServer.runConnectorSync(connectorId)),

  // Unmapped
  getUnmappedLeads: (f: Filters) => simulate(() => mockServer.getUnmappedLeads(f)),
  getUnmappedSpend: (f: Filters) => simulate(() => mockServer.getUnmappedSpend(f)),
  getUnmappedSessions: (f: Filters) => simulate(() => mockServer.getUnmappedSessions(f)),

  // Sync
  getSyncLogs: (connectorId?: string) => simulate(() => mockServer.getSyncLogs(connectorId)),

  // Assistant
  getAssistantContext: (f: Filters) => simulate(() => mockServer.getAssistantContext(f)),

  // Ingestion
  ingestEvent: (payload: any) => simulate(() => mockServer.ingestEvent(payload)),
  ingestVideoEvent: (payload: any) => simulate(() => mockServer.ingestVideoEvent(payload)),
  identifyContact: (payload: any) => simulate(() => mockServer.identifyContact(payload)),

  // System
  resetData: () => simulate(() => mockServer.resetData()),
  getSystemHealth: () => simulate(() => mockServer.getSystemHealth()),
};

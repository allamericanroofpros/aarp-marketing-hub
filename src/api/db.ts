import { getMockData, updateMockData, resetMockData as _reset } from '@/data/mockState';
import type { MockData } from '@/data/types';

export const DB_VERSION = 3;
const META_KEY = 'aarp-db-meta-v3';

export interface SyncLog {
  id: string;
  connector_id: string;
  timestamp: string;
  status: 'success' | 'error';
  message: string;
  imported?: { leads?: number; spend?: number; sessions?: number };
}

export interface Job {
  id: string;
  type: string;
  status: 'queued' | 'running' | 'success' | 'failed';
  progress: number;
  logs: string[];
  createdAt: string;
  finishedAt?: string;
}

interface Meta { version: number; syncLogs: SyncLog[]; jobs: Job[] }
let meta: Meta | null = null;

function loadMeta(): Meta {
  if (meta) return meta;
  try {
    const p = JSON.parse(localStorage.getItem(META_KEY) || '');
    if (p?.version === DB_VERSION) { meta = p; return meta!; }
  } catch {}
  meta = { version: DB_VERSION, syncLogs: [], jobs: [] };
  saveMeta();
  return meta;
}

function saveMeta() {
  if (meta) localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export const db = {
  getData: (): MockData => getMockData(),
  setData: (d: MockData) => updateMockData(d),
  reset() {
    _reset();
    meta = null;
    localStorage.removeItem(META_KEY);
  },

  getSyncLogs(cid?: string) {
    const m = loadMeta();
    return cid ? m.syncLogs.filter(l => l.connector_id === cid) : m.syncLogs;
  },
  addSyncLog(log: SyncLog) {
    const m = loadMeta();
    m.syncLogs.unshift(log);
    if (m.syncLogs.length > 100) m.syncLogs.length = 100;
    saveMeta();
  },

  getJobs: () => loadMeta().jobs,
  upsertJob(job: Job) {
    const m = loadMeta();
    const i = m.jobs.findIndex(j => j.id === job.id);
    if (i >= 0) m.jobs[i] = job; else m.jobs.unshift(job);
    saveMeta();
  },

  getStats() {
    const d = this.getData();
    const m = loadMeta();
    return {
      version: DB_VERSION,
      contacts: d.contacts.length,
      sessions: d.sessions.length,
      events: d.events.length,
      videoEvents: d.videoEvents.length,
      leads: d.leads.length,
      deals: d.deals.length,
      spend: d.spend.length,
      connectors: d.connectors.length,
      syncLogs: m.syncLogs.length,
      activeJobs: m.jobs.filter(j => j.status === 'running' || j.status === 'queued').length,
      totalJobs: m.jobs.length,
    };
  },
};

import { api } from '@/api/client';

const ANON_KEY = 'aarp-anon-id';
const SESSION_KEY = 'aarp-session';

function generateId(): string {
  return 'anon-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function getStoredAnonId(): string {
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

function getStoredSessionId(): string {
  const today = new Date().toISOString().split('T')[0];
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.day === today) return parsed.id;
    } catch {}
  }
  const id = 'sess-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ day: today, id }));
  return id;
}

export interface TrackingSDK {
  init(config: { projectId: string; endpoint: string }): void;
  identify(contactId: string, traits?: Record<string, any>): void;
  track(eventName: string, props?: Record<string, any>): void;
  page(url?: string, title?: string): void;
  trackVideo(videoId: string, eventName: string, props?: Record<string, any>): void;
  getAnonymousId(): string;
  getSessionId(): string;
  reset(): void;
}

export const trackingSDK: TrackingSDK = {
  init: () => {},
  identify: (contactId, traits) => {
    api.identifyContact({ anonymous_id: getStoredAnonId(), contact_id: contactId, ...traits });
  },
  track: (eventName, props) => {
    api.ingestEvent({
      session_id: getStoredSessionId(),
      anonymous_id: getStoredAnonId(),
      name: eventName,
      props: props || {},
    });
  },
  page: (url, title) => {
    api.ingestEvent({
      session_id: getStoredSessionId(),
      anonymous_id: getStoredAnonId(),
      name: 'page_view',
      props: { url: url || window.location.pathname, title: title || document.title },
    });
  },
  trackVideo: (videoId, eventName, props) => {
    api.ingestVideoEvent({
      video_id: videoId,
      session_id: getStoredSessionId(),
      anonymous_id: getStoredAnonId(),
      name: eventName,
      props: props || {},
    });
  },
  getAnonymousId: () => getStoredAnonId(),
  getSessionId: () => getStoredSessionId(),
  reset: () => {
    localStorage.removeItem(ANON_KEY);
    localStorage.removeItem(SESSION_KEY);
  },
};

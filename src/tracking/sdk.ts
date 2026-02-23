import { supabase } from '@/integrations/supabase/client';

const ANON_KEY = 'aarp-anon-id';
const SESSION_KEY = 'aarp-session';
const CONTACT_ID_KEY = 'aarp-contact-id';

// API_MODE: "supabase" sends to edge functions; "mock" uses local mock server
const API_MODE: 'supabase' | 'mock' = 'supabase';

function generateId(): string {
  return 'anon-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function generateClientEventId(): string {
  return crypto.randomUUID();
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

function getStoredContactId(): string | undefined {
  return localStorage.getItem(CONTACT_ID_KEY) || undefined;
}

async function callEdge(fnName: string, payload: Record<string, any>): Promise<any> {
  try {
    const { data, error } = await supabase.functions.invoke(fnName, { body: payload });
    if (error) {
      console.warn(`[trackingSDK] Edge function ${fnName} error:`, error);
    }
    return data;
  } catch (e) {
    console.warn(`[trackingSDK] Edge function ${fnName} failed:`, e);
    return null;
  }
}

async function callMock(action: string, payload: Record<string, any>): Promise<void> {
  try {
    const { api } = await import('@/api/client');
    if (action === 'event') api.ingestEvent(payload);
    else if (action === 'video') api.ingestVideoEvent(payload);
    else if (action === 'identify') api.identifyContact(payload);
  } catch (e) {
    console.warn(`[trackingSDK] Mock fallback failed:`, e);
  }
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
    const payload = { anonymous_id: getStoredAnonId(), contact_id: contactId, ...traits };
    if (API_MODE === 'supabase') {
      callEdge('identify', payload).then((data) => {
        // Store canonical UUID contact_id from server response
        if (data?.contact?.id) {
          localStorage.setItem(CONTACT_ID_KEY, data.contact.id);
        }
      });
    } else {
      callMock('identify', payload);
    }
  },

  track: (eventName, props) => {
    const payload: Record<string, any> = {
      session_id: getStoredSessionId(),
      anonymous_id: getStoredAnonId(),
      name: eventName,
      props: props || {},
      client_event_id: generateClientEventId(),
    };
    const cid = getStoredContactId();
    if (cid) payload.contact_id = cid;

    if (API_MODE === 'supabase') {
      callEdge('ingest-event', payload);
    } else {
      callMock('event', payload);
    }
  },

  page: (url, title) => {
    const payload: Record<string, any> = {
      session_id: getStoredSessionId(),
      anonymous_id: getStoredAnonId(),
      name: 'page_view',
      props: { url: url || window.location.pathname, title: title || document.title },
      client_event_id: generateClientEventId(),
    };
    const cid = getStoredContactId();
    if (cid) payload.contact_id = cid;

    if (API_MODE === 'supabase') {
      callEdge('ingest-event', payload);
    } else {
      callMock('event', payload);
    }
  },

  trackVideo: (videoId, eventName, props) => {
    const payload: Record<string, any> = {
      video_id: videoId,
      session_id: getStoredSessionId(),
      anonymous_id: getStoredAnonId(),
      name: eventName,
      props: props || {},
      client_event_id: generateClientEventId(),
    };
    const cid = getStoredContactId();
    if (cid) payload.contact_id = cid;

    if (API_MODE === 'supabase') {
      callEdge('ingest-video', payload);
    } else {
      callMock('video', payload);
    }
  },

  getAnonymousId: () => getStoredAnonId(),
  getSessionId: () => getStoredSessionId(),
  reset: () => {
    localStorage.removeItem(ANON_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(CONTACT_ID_KEY);
  },
};

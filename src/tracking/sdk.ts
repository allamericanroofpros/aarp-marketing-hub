import { api } from '@/api/client';

export interface TrackingSDK {
  init(config: { projectId: string; endpoint: string }): void;
  identify(contactId: string, traits?: Record<string, any>): void;
  track(eventName: string, props?: Record<string, any>): void;
  page(url?: string, title?: string): void;
  trackVideo(videoId: string, eventName: string, props?: Record<string, any>): void;
  getAnonymousId(): string;
  reset(): void;
}

export const trackingSDK: TrackingSDK = {
  init: () => {},
  identify: (contactId, traits) => {
    api.identifyContact({ anonymous_id: trackingSDK.getAnonymousId(), contact_id: contactId, ...traits });
  },
  track: (eventName, props) => {
    api.ingestEvent({ session_id: '', anonymous_id: trackingSDK.getAnonymousId(), name: eventName, props: props || {} });
  },
  page: (url, title) => {
    api.ingestEvent({ session_id: '', anonymous_id: trackingSDK.getAnonymousId(), name: 'page_view', props: { url, title } });
  },
  trackVideo: (videoId, eventName, props) => {
    api.ingestVideoEvent({ video_id: videoId, session_id: '', anonymous_id: trackingSDK.getAnonymousId(), name: eventName, props: props || {} });
  },
  getAnonymousId: () => 'demo-anon-id',
  reset: () => {},
};

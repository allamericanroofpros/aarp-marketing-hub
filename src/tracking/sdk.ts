// Tracking SDK stub — will be replaced with real implementation
// This defines the interface for client-side event tracking

export interface TrackingSDK {
  init(config: { projectId: string; endpoint: string }): void;
  identify(contactId: string, traits?: Record<string, any>): void;
  track(eventName: string, props?: Record<string, any>): void;
  page(url?: string, title?: string): void;
  trackVideo(videoId: string, eventName: string, props?: Record<string, any>): void;
  getAnonymousId(): string;
  reset(): void;
}

// No-op implementation for demo
export const trackingSDK: TrackingSDK = {
  init: () => {},
  identify: () => {},
  track: () => {},
  page: () => {},
  trackVideo: () => {},
  getAnonymousId: () => 'demo-anon-id',
  reset: () => {},
};

// Event payload contracts for future backend integration

export interface SessionPayload {
  anonymous_id: string;
  contact_id?: string;
  landing_page: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  device: 'mobile' | 'desktop';
  location: string;
}

export interface EventPayload {
  session_id: string;
  anonymous_id: string;
  contact_id?: string;
  name: string;
  props: Record<string, any>;
}

export interface VideoEventPayload {
  video_id: string;
  session_id: string;
  anonymous_id: string;
  contact_id?: string;
  name: 'impression' | 'play' | 'progress' | 'complete' | 'dropoff';
  props: { percent?: number; timecode_sec?: number };
}

export interface IdentifyPayload {
  anonymous_id: string;
  contact_id: string;
  email?: string;
  phone?: string;
  name?: string;
}

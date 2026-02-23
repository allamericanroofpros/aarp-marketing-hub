
-- Contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email TEXT,
  phone TEXT,
  name TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lifecycle_stage TEXT NOT NULL DEFAULT 'anonymous',
  anonymous_id TEXT
);

CREATE INDEX idx_contacts_anonymous_id ON public.contacts(anonymous_id);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Sessions table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  anonymous_id TEXT NOT NULL,
  contact_id UUID REFERENCES public.contacts(id),
  landing_page TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device TEXT,
  location TEXT
);

CREATE INDEX idx_sessions_anonymous_id ON public.sessions(anonymous_id);
CREATE INDEX idx_sessions_contact_id ON public.sessions(contact_id);
CREATE INDEX idx_sessions_started_at ON public.sessions(started_at);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id UUID REFERENCES public.sessions(id),
  anonymous_id TEXT NOT NULL,
  contact_id UUID REFERENCES public.contacts(id),
  name TEXT NOT NULL,
  props JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_events_anonymous_id ON public.events(anonymous_id);
CREATE INDEX idx_events_contact_id ON public.events(contact_id);
CREATE INDEX idx_events_ts ON public.events(ts);
CREATE INDEX idx_events_session_id ON public.events(session_id);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Video events table
CREATE TABLE public.video_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  video_id TEXT NOT NULL,
  session_id UUID REFERENCES public.sessions(id),
  anonymous_id TEXT NOT NULL,
  contact_id UUID REFERENCES public.contacts(id),
  name TEXT NOT NULL,
  props JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_video_events_anonymous_id ON public.video_events(anonymous_id);
CREATE INDEX idx_video_events_contact_id ON public.video_events(contact_id);
CREATE INDEX idx_video_events_ts ON public.video_events(ts);
CREATE INDEX idx_video_events_video_id ON public.video_events(video_id);
ALTER TABLE public.video_events ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can read, no direct writes (writes via service role in edge functions)
CREATE POLICY "Authenticated read contacts" ON public.contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read sessions" ON public.sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read video_events" ON public.video_events FOR SELECT TO authenticated USING (true);

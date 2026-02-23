
-- A) Dedupe: add client_event_id
ALTER TABLE public.events ADD COLUMN client_event_id text;
ALTER TABLE public.video_events ADD COLUMN client_event_id text;

CREATE UNIQUE INDEX idx_events_client_event_id ON public.events (client_event_id) WHERE client_event_id IS NOT NULL;
CREATE UNIQUE INDEX idx_video_events_client_event_id ON public.video_events (client_event_id) WHERE client_event_id IS NOT NULL;

-- C) Identify: external_contact_key
ALTER TABLE public.contacts ADD COLUMN external_contact_key text UNIQUE;

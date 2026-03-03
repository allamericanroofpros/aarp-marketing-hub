
CREATE TABLE public.content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content_type text NOT NULL DEFAULT 'blog',
  location text NOT NULL DEFAULT 'All Areas',
  scheduled_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'planned',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read content_calendar"
  ON public.content_calendar FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert content_calendar"
  ON public.content_calendar FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update content_calendar"
  ON public.content_calendar FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete content_calendar"
  ON public.content_calendar FOR DELETE TO authenticated USING (true);

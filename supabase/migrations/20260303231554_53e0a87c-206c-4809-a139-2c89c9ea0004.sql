
CREATE TABLE public.microsites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  service text NOT NULL,
  url text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  leads integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.microsites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read microsites"
  ON public.microsites FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert microsites"
  ON public.microsites FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update microsites"
  ON public.microsites FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete microsites"
  ON public.microsites FOR DELETE TO authenticated
  USING (true);

-- Seed initial data
INSERT INTO public.microsites (name, location, service, status, leads) VALUES
  ('Mansfield Roof Repair', 'Mansfield', 'Roof Repair', 'live', 24),
  ('Sandusky Storm Damage', 'Sandusky', 'Storm Damage', 'live', 18),
  ('Huron Gutter Install', 'Huron', 'Gutters', 'draft', 0),
  ('Mansfield Siding', 'Mansfield', 'Siding', 'live', 11),
  ('Sandusky New Roof', 'Sandusky', 'New Roof', 'paused', 7);

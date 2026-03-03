
CREATE TABLE public.seo_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'keywords',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read seo_briefs"
  ON public.seo_briefs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert seo_briefs"
  ON public.seo_briefs FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update seo_briefs"
  ON public.seo_briefs FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete seo_briefs"
  ON public.seo_briefs FOR DELETE TO authenticated
  USING (true);

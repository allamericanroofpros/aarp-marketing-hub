
-- Update RLS policies on data tables to require admin or team role via has_role()

-- contacts
DROP POLICY IF EXISTS "Authenticated read contacts" ON public.contacts;
CREATE POLICY "Role-based read contacts" ON public.contacts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'team'::app_role));

-- sessions
DROP POLICY IF EXISTS "Authenticated read sessions" ON public.sessions;
CREATE POLICY "Role-based read sessions" ON public.sessions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'team'::app_role));

-- events
DROP POLICY IF EXISTS "Authenticated read events" ON public.events;
CREATE POLICY "Role-based read events" ON public.events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'team'::app_role));

-- video_events
DROP POLICY IF EXISTS "Authenticated read video_events" ON public.video_events;
CREATE POLICY "Role-based read video_events" ON public.video_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'team'::app_role));

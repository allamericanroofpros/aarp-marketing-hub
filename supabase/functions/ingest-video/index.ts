import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { anonymous_id, video_id, name, props, contact_id } = body;
    const ts = body.ts || new Date().toISOString();

    if (!anonymous_id || !video_id || !name) {
      return new Response(JSON.stringify({ error: "anonymous_id, video_id, and name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find or create session
    const dayStart = new Date(ts);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    let sessionId = body.session_id;

    if (!sessionId) {
      const { data: existing } = await supabase
        .from("sessions")
        .select("id")
        .eq("anonymous_id", anonymous_id)
        .gte("started_at", dayStart.toISOString())
        .lt("started_at", dayEnd.toISOString())
        .order("started_at", { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        sessionId = existing[0].id;
      } else {
        const { data: newSession } = await supabase
          .from("sessions")
          .insert({ anonymous_id, started_at: ts, ended_at: ts })
          .select("id")
          .single();
        sessionId = newSession?.id;
      }
    }

    await supabase.from("sessions").update({ ended_at: ts }).eq("id", sessionId);

    const { data: evt, error } = await supabase
      .from("video_events")
      .insert({
        ts,
        video_id,
        session_id: sessionId,
        anonymous_id,
        contact_id: contact_id || null,
        name,
        props: props || {},
      })
      .select("id")
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ ok: true, eventId: evt.id, sessionId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

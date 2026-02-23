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
    const { anonymous_id, name, props, contact_id, client_event_id } = body;
    const ts = body.ts || new Date().toISOString();

    if (!anonymous_id || !name) {
      return new Response(JSON.stringify({ error: "anonymous_id and name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Session resolution with stale fallback ---
    let sessionId: string | undefined;

    if (body.session_id) {
      const { count } = await supabase
        .from("sessions")
        .update({ ended_at: ts })
        .eq("id", body.session_id)
        .select("id", { count: "exact", head: true });

      if (count && count > 0) {
        sessionId = body.session_id;
      }
    }

    if (!sessionId) {
      const dayStart = new Date(ts);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

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
        await supabase.from("sessions").update({ ended_at: ts }).eq("id", sessionId);
      } else {
        const { data: newSession } = await supabase
          .from("sessions")
          .insert({
            anonymous_id,
            contact_id: contact_id || null,
            started_at: ts,
            ended_at: ts,
            landing_page: props?.url || null,
            utm_source: props?.utm_source || null,
            utm_medium: props?.utm_medium || null,
            utm_campaign: props?.utm_campaign || null,
          })
          .select("id")
          .single();
        sessionId = newSession?.id;
      }
    }

    // --- Insert event with dedupe ---
    const row: Record<string, any> = {
      ts,
      session_id: sessionId,
      anonymous_id,
      contact_id: contact_id || null,
      name,
      props: props || {},
    };
    if (client_event_id) row.client_event_id = client_event_id;

    const { data: evt, error } = await supabase
      .from("events")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      // Check for unique violation on client_event_id (code 23505)
      if (error.code === "23505" && client_event_id) {
        console.log(`[ingest-event] Dedupe hit for client_event_id=${client_event_id}`);
        return new Response(
          JSON.stringify({ ok: true, deduped: true, sessionId }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw error;
    }

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

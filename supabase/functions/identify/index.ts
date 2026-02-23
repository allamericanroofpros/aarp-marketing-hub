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
    const { anonymous_id, contact_id, email, phone, name } = body;

    if (!anonymous_id || !contact_id) {
      return new Response(JSON.stringify({ error: "anonymous_id and contact_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert contact by anonymous_id
    const now = new Date().toISOString();
    const { data: existing } = await supabase
      .from("contacts")
      .select("*")
      .eq("anonymous_id", anonymous_id)
      .maybeSingle();

    let contact;
    if (existing) {
      const { data, error: upErr } = await supabase
        .from("contacts")
        .update({
          last_seen_at: now,
          ...(email && { email }),
          ...(phone && { phone }),
          ...(name && { name }),
          lifecycle_stage: "lead",
        })
        .eq("id", existing.id)
        .select()
        .single();
      if (upErr) console.error("Update contact error:", upErr);
      contact = data;
    } else {
      const { data, error: insErr } = await supabase
        .from("contacts")
        .insert({
          anonymous_id,
          email: email || null,
          phone: phone || null,
          name: name || null,
          first_seen_at: now,
          last_seen_at: now,
          lifecycle_stage: "lead",
        })
        .select()
        .single();
      if (insErr) console.error("Insert contact error:", insErr);
      contact = data;
    }

    const contactUuid = contact?.id;

    // Stitch: update sessions, events, video_events where anonymous_id matches and contact_id is null
    if (contactUuid) {
      await supabase
        .from("sessions")
        .update({ contact_id: contactUuid })
        .eq("anonymous_id", anonymous_id)
        .is("contact_id", null);

      await supabase
        .from("events")
        .update({ contact_id: contactUuid })
        .eq("anonymous_id", anonymous_id)
        .is("contact_id", null);

    await supabase
      await supabase
        .from("video_events")
        .update({ contact_id: contactUuid })
        .eq("anonymous_id", anonymous_id)
        .is("contact_id", null);
    }

    return new Response(
      JSON.stringify({ ok: true, contact }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

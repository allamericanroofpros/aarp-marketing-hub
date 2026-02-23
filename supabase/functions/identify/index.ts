import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    const isUuid = UUID_RE.test(contact_id);
    const now = new Date().toISOString();
    let contact: any;

    if (isUuid) {
      // UUID contact_id — current behavior: upsert by anonymous_id
      const { data: existing } = await supabase
        .from("contacts")
        .select("*")
        .eq("anonymous_id", anonymous_id)
        .maybeSingle();

      if (existing) {
        const { data } = await supabase
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
        contact = data;
      } else {
        const { data } = await supabase
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
        contact = data;
      }
    } else {
      // Non-UUID: treat contact_id as external_contact_key
      const { data: existing } = await supabase
        .from("contacts")
        .select("*")
        .eq("external_contact_key", contact_id)
        .maybeSingle();

      if (existing) {
        const { data } = await supabase
          .from("contacts")
          .update({
            last_seen_at: now,
            anonymous_id,
            ...(email && { email }),
            ...(phone && { phone }),
            ...(name && { name }),
            lifecycle_stage: "lead",
          })
          .eq("id", existing.id)
          .select()
          .single();
        contact = data;
      } else {
        const { data } = await supabase
          .from("contacts")
          .insert({
            anonymous_id,
            external_contact_key: contact_id,
            email: email || null,
            phone: phone || null,
            name: name || null,
            first_seen_at: now,
            last_seen_at: now,
            lifecycle_stage: "lead",
          })
          .select()
          .single();
        contact = data;
      }
    }

    const contactUuid = contact?.id;

    // Stitch anonymous records to contact
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

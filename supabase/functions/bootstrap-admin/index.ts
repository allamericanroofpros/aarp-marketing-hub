import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Check if any admin exists
  const { data: admins, error: checkError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1);

  if (checkError) {
    return new Response(JSON.stringify({ error: checkError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminExists = admins && admins.length > 0;

  // GET: just return whether admin exists
  if (req.method === "GET") {
    return new Response(JSON.stringify({ adminExists }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // POST: create first admin
  if (adminExists) {
    return new Response(
      JSON.stringify({ error: "Admin already exists. Setup is locked." }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const { email, password } = await req.json();

  if (!email || !password || password.length < 6) {
    return new Response(
      JSON.stringify({ error: "Email and password (min 6 chars) required." }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Create auth user with confirmed email
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Insert admin profile
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert({
      user_id: authData.user.id,
      role: "admin",
      display_name: email,
    });

  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

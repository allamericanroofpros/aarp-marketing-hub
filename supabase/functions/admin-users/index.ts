import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate caller
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResp({ error: "Unauthorized" }, 401);
  }

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } =
    await supabaseUser.auth.getClaims(token);

  if (claimsError || !claimsData?.claims) {
    return jsonResp({ error: "Unauthorized" }, 401);
  }

  const callerId = claimsData.claims.sub as string;

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify caller is admin
  const { data: callerProfile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", callerId)
    .single();

  if (!callerProfile || callerProfile.role !== "admin") {
    return jsonResp({ error: "Admin access required" }, 403);
  }

  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "invite": {
      const { email, role = "team" } = body;
      if (!email) return jsonResp({ error: "Email required" }, 400);

      const origin =
        req.headers.get("origin") || Deno.env.get("SITE_URL") || "";
      const { data: inviteData, error: inviteError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${origin}/auth/callback`,
        });

      if (inviteError) {
        return jsonResp({ error: inviteError.message }, 400);
      }

      // Upsert profile for the invited user
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            user_id: inviteData.user.id,
            role,
            display_name: email,
          },
          { onConflict: "user_id" }
        );

      if (profileError) {
        return jsonResp({ error: profileError.message }, 500);
      }

      return jsonResp({ success: true, userId: inviteData.user.id });
    }

    case "list": {
      const { data: usersData, error: usersError } =
        await supabaseAdmin.auth.admin.listUsers();
      if (usersError) {
        return jsonResp({ error: usersError.message }, 500);
      }

      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, role, display_name");

      const merged = usersData.users.map((u) => {
        const profile = profiles?.find((p) => p.user_id === u.id);
        return {
          id: u.id,
          email: u.email,
          role: profile?.role || null,
          display_name: profile?.display_name || null,
          created_at: u.created_at,
          confirmed: !!u.email_confirmed_at,
          last_sign_in: u.last_sign_in_at,
        };
      });

      return jsonResp({ users: merged });
    }

    case "setRole": {
      const { targetUserId, role } = body;
      if (!targetUserId || !role) {
        return jsonResp({ error: "targetUserId and role required" }, 400);
      }
      if (!["admin", "team"].includes(role)) {
        return jsonResp({ error: "Invalid role" }, 400);
      }

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ role })
        .eq("user_id", targetUserId);

      if (error) {
        return jsonResp({ error: error.message }, 400);
      }

      return jsonResp({ success: true });
    }

    default:
      return jsonResp({ error: "Unknown action" }, 400);
  }
});

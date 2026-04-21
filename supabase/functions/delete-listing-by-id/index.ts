import { createClient } from "npm:@supabase/supabase-js@2";

// Deno errors can be ignored in local dev. 
// to deploy: $ npx supabase functions deploy delete-listing-by-id
// after deploying, urn off "Verify JWT with legacy secret" in functions settings.
//

interface DeleteListingRequest {
  listingID?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { listingID } = (await req.json().catch(() => ({}))) as DeleteListingRequest;

    if (!listingID) {
      return new Response(JSON.stringify({ error: "listingID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const userToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!userToken) {
      return new Response(JSON.stringify({ error: "Missing Authorization Bearer token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const {
      data: { user },
      error: userErr,
    } = await supabaseUser.auth.getUser(userToken);

    if (userErr || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: userErr?.message ?? "No user returned",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    // Admin SDK priveledges
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: listing, error: listingErr } = await supabaseAdmin
      .from("listings")
      .select("*")
      .eq("listingID", listingID)
      .maybeSingle();

    if (listingErr) {
      return new Response(JSON.stringify({ error: "Failed to fetch listing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!listing) {
      return new Response(JSON.stringify({ error: "Listing not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (listing.listerUID !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden: only the lister can delete this listing" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: delErr } = await supabaseAdmin
      .from("listings")
      .delete()
      .eq("listingID", listingID);

    if (delErr) {
      return new Response(JSON.stringify({ error: "Failed to delete listing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }



    // Try to delete listing from qdrant. Catch if fail=> restore supabase row.
    try {
      const res = await fetch(`http://vectordb.gageserver.net/remove-vector/${listingID}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`remove-vector failed: ${res.status} ${err}`);
        }

      
    } catch (qdrantErr) {
      await supabaseAdmin.from("listings").insert(listing);
      console.error("Failed to delete from qdrant, restored Supabase row:", qdrantErr);
      return new Response(JSON.stringify({ error: "Failed to delete listing from search index, but Supabase record was restored" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, listingID }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

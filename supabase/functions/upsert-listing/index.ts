import { createClient } from "npm:@supabase/supabase-js@2";

// Deno errors can be ignored in local dev. 
// to deploy: $ npx supabase functions deploy upsert-listing
// after deploying, urn off "Verify JWT with legacy secret" in functions settings.
interface Listing {
  listingID: string;
  brand: string;
  name: string;
  type: string;
  size: number;
  price: number;
  imageURL: string;
  listerUID?: string;
  description?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function listingToTextItem(listing: Listing) {
  const text = [
    listing.brand,
    listing.name,
    listing.type,
    `size ${listing.size}`,
    `$${listing.price}`,
    `${listing.description || ""}`
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    id: listing.listingID,
    text,
    metadata: {
      listingID: listing.listingID,
      brand: listing.brand,
      name: listing.name,
      type: listing.type,
      size: listing.size,
      price: listing.price,
      imageURL: listing.imageURL,
      listerUID: listing.listerUID || null
    }
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const listing = (await req.json().catch(() => ({}))) as Listing;

    if (!listing.listingID) {
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

    const { error: upsertError } = await supabaseAdmin
      .from("listings")
      .upsert(listing, { onConflict: "listingID" });

    if (upsertError) {
      return new Response(JSON.stringify({ error: "Failed to upsert listing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to add listing to qdrant. Catch if fail=> delete supabase row.
    try {
      const qdrantCompatibleListing = listingToTextItem(listing);
      const res = await fetch("http://vectordb.gageserver.net/add-vector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([qdrantCompatibleListing]) // endpoint expects List[TextItem]
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`add-vector failed: ${res.status} ${err}`);
        }

      return res.json();
    } catch (e) {
      await supabaseAdmin.from("listings").delete().eq("listingID", listing.listingID);
      console.error("Failed to add listing to Qdrant, rolled back Supabase insert", {
        error: (e as Error).message ?? "Unknown error",
        listingID: listing.listingID
      });
    }
    return new Response(JSON.stringify({ ok: true, listingID: listing.listingID }), {
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

import { createClient } from "npm:@supabase/supabase-js@2";
// Deno errors can be ignored in local dev. 
// to deploy: $ npx supabase functions deploy delete-listing-by-id
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

const restoreListingsToDB = async (deletedListings: Listing[] | undefined, error: any, supabaseAdmin: any) => {
      // restore deleted listings on supbasedb.
      if (deletedListings?.length) {
        await supabaseAdmin.from("listings").insert(deletedListings)    
      }
      console.error("Failed to delete from qdrant, restored Supabase rows:", error);
      return new Response(JSON.stringify({ error: "Failed to delete listings, but Supabase records were restored" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

Deno.serve(async (req: Request) => {
  // Expect JSON body: {} (or you can ignore body entirely)
  // The user we delete is the one in the caller's Authorization header.
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  // Verify that a Bearer token is present in the Authorization header
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
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization") ?? "",
        },
      },
    }
  );

  // 1) Identify the current user from the session JWT
  const {
    data: { user },
    error: userErr,
  } = await supabaseUser.auth.getUser();
 
  if (userErr || !user) {
    return new Response(
      JSON.stringify({ ok: false, error: userErr?.message ?? "No user in session" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 2) Delete via Admin API (service role key)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ===================delete listings first ===========================
  const { data: deletedListings , error: listingsErr } = await supabaseAdmin
    .from("listings")
    .delete()
    .eq("listerUID", user.id)
    .select("*");

  if (listingsErr) {
    return new Response(
      JSON.stringify({ ok: false, error: listingsErr.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  

  // 1) delete the user row in your public.users table
  const { data: deletedUserRow, error: userRowErr } = await supabaseAdmin
    .from("users")
    .delete()
    .eq("userID", user.id)
    .select("*");

  if (userRowErr) {
    //rollback deleted listings if user row delete fails
    return restoreListingsToDB(deletedListings, userRowErr, supabaseAdmin);
}

  // delete the listing vectors from qdrant.
  try {
    await Promise.all(
      (deletedListings ?? []).map((listing : Listing) =>
        fetch(`http://vectordb.gageserver.net/remove-vector/${listing.listingID}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }).then((res) => {
          if (!res.ok) {
            return res.text().then((err) => {
              throw new Error(`remove-vector failed for listing ${listing.listingID}: ${res.status} ${err}`);
            });
          }
        })
      )
    );
    } catch (qdrantErr) {
      // restore deleted listings on supbasedb.
        const restoreListings = await restoreListingsToDB(deletedListings, qdrantErr, supabaseAdmin);
        if (!restoreListings.ok) {
          console.error("Failed to restore listings after qdrant deletion failure:");
        }
        //rollback deleted user row
        if (!deletedUserRow?.length) {
          console.error("No user row was deleted, so no rollback needed");
        } else {
          try {
            await supabaseAdmin.from("users").insert(deletedUserRow);
          } catch (rollbackErr) {
            console.error("Failed to rollback user row after qdrant deletion failure:", rollbackErr);
          }
        }
        console.error("Failed to delete listing vectors from qdrant:", qdrantErr);
        return new Response(JSON.stringify({ error: "Failed to delete listing vectors, but Supabase records were restored" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

  //delete user preference vector if there is one. If it returns {"detail":"ID not found"}, we can ignore since it just means there was no vector to delete.
  try {
    const res = await fetch(`http://vectordb.gageserver.net/remove-vector/${user.id}`, {
      method: "DELETE",
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errText = await res.text();
      if (!errText.includes("ID not found")) {
        // this means the ID was found but deletion failed.
        throw new Error(`Failed to delete user preference vector: ${res.status} ${errText}`);
      }
    }
  }
  catch (qdrantErr) {
    // we can live with the fact that the preference vector deletion could potentially fail. It is easier than restoring dozens of vectors.
  }


  //finally delete the user from supabase auth. We assume this doesnt fail.
  const { data, error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("User Data deleted, however failed to delete user from Supabase Auth:", error);
    return new Response(JSON.stringify({ error: "Failed to delete user from authentication system" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Note: this does not necessarily invalidate already-issued JWTs immediately.
  return new Response(
    JSON.stringify({ ok: true, deletedUserId: user.id, data }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
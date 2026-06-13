import { createClient } from "npm:@supabase/supabase-js@2";

interface Listing {
  listingID: string;
  brand: string;
  name: string;
  type: string;
  size: number;
  price: number;
  imageURL: string;
  listerUID?: string;
}

type FeedResult = {
  id: string;
  score: number;
  payload: {
    listingID: string;
    brand: string;
    name: string;
    size: number;
    type: string;
    imageURL: string;
    price: number;
    listerUID?: string | null;
  };
};

type OrderRow = {
  listingID: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const RECOMMENDER_URL = Deno.env.get("RECOMMENDER_URL") ?? "http://vectordb.gageserver.net";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function toFeedResults(listings: Listing[]): FeedResult[] {
  return listings.map((listing) => ({
    id: listing.listingID,
    score: 0,
    payload: {
      listingID: listing.listingID,
      brand: listing.brand,
      name: listing.name,
      size: listing.size,
      type: listing.type,
      imageURL: listing.imageURL,
      price: listing.price,
      listerUID: listing.listerUID ?? null,
    },
  }));
}

async function getRandomListings(supabaseAdmin: ReturnType<typeof createClient>) {
  const { data: listings, error } = await supabaseAdmin
    .from("listings")
    .select("listingID, brand, name, type, size, price, imageURL, listerUID");

  if (error) {
    throw new Error("Failed to fetch fallback listings");
  }

  const randomListings = shuffle((listings ?? []) as Listing[]).slice(0, 10);
  return { results: toFeedResults(randomListings) };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
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

    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser(userToken);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch 5 most recent orders for this user
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from("orders")
      .select("listingID")
      .eq("userID", user.id)
      .order("datetime", { ascending: false })
      .limit(5);

    if (ordersErr) {
      return new Response(JSON.stringify({ error: "Failed to fetch orders" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!orders || orders.length === 0) {
      // No order history — fall back to a default text search
      const res = await fetch(`${RECOMMENDER_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query_text: "shoes", top_n: 10 }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Recommender search failed, falling back to random listings:", res.status, err);
        const fallbackFeed = await getRandomListings(supabaseAdmin);
        return new Response(JSON.stringify(fallbackFeed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // listing_ids ordered oldest→newest so weights favour the most recent
    const orderRows = orders as OrderRow[];
    const listingIds = orderRows.map((order) => order.listingID).reverse();
    const excludeIds = orderRows.map((order) => order.listingID); // don't resurface already-bought items

    const res = await fetch(`${RECOMMENDER_URL}/recommend/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_ids: listingIds, exclude_ids: excludeIds, top_n: 10 }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Recommender failed, falling back to random listings:", res.status, err);
      const fallbackFeed = await getRandomListings(supabaseAdmin);
      return new Response(JSON.stringify(fallbackFeed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const feed = await res.json();
    return new Response(JSON.stringify(feed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const fallbackFeed = await getRandomListings(supabaseAdmin);
      return new Response(JSON.stringify(fallbackFeed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (fallbackErr) {
      return new Response(JSON.stringify({ error: (fallbackErr as Error).message ?? (e as Error).message ?? "Unknown error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }
});

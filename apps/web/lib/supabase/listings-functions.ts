
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Listing } from "@/components/listing-card";
// Lives for the page session. Clears automatically on full reload.
// THIS FILE IS CLIENT-VISIBLE, It calls edge functions that perform the actual DB operations, and updates the local cache for instant UI updates.
export type FeedListing = {
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
    listerUID?: string;
    original_text?: string;
  };
};

export type FeedListingsResponse = {
  results: FeedListing[];
};


let listingsCache: Listing[] | null = null;

const fetchUserListings = async ( 
  supabase: SupabaseClient,
  userID: string
): Promise<Listing[]> => {
  if (listingsCache !== null) return listingsCache;

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("listerUID", userID);

  if (error) throw new Error(error.message);

  listingsCache = (data as Listing[]) ?? [];
  return listingsCache;
};

const updateListingsCache = (listings: Listing[]) => {
  listingsCache = listings;
};


const deleteListing = async (listingID: string, supabase: SupabaseClient) => {
  const { data, error } = await supabase.functions.invoke("delete-listing-by-id", {
    body: { listingID },
  });

  if (error) {
    console.error("Function execution error:", error);
    throw new Error(error.message || "Delete failed");
  }

  return data; // { ok: true, listingID }
};

const upsertListing = async (listing: Listing, supabase: SupabaseClient) => {
  const { data, error } = await supabase.functions.invoke("upsert-listing", {
    body: listing,
  });

  if (error) {
    console.error("Function execution error:", error);
    throw new Error(error.message || "Upsert failed");
  }

  return data; // { ok: true, listingID }
};


const getFeedListings = async (supabase: SupabaseClient): Promise<FeedListingsResponse> => {
  const { data, error } = await supabase.functions.invoke("get-feed"); 

  if (error) {
    console.error("Function execution error:", error);
    throw new Error(error.message || "Failed to fetch feed listings");
  }

  return data as FeedListingsResponse;
};

export { fetchUserListings, updateListingsCache, deleteListing, upsertListing, getFeedListings };

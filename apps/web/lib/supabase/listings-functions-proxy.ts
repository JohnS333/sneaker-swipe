
import type { SupabaseClient } from "@supabase/supabase-js";

const deleteListing = async (listingID: string, supabase: SupabaseClient) => {
  // Use the built-in invoke method instead of fetch
  const { data, error } = await supabase.functions.invoke("delete-listing-by-id", {
    body: { listingID },
  });

  if (error) {
    // Supabase returns errors in a specific format; catch them here
    console.error("Function execution error:", error);
    throw new Error(error.message || "Delete failed");
  }

  return data; // { ok: true, listingID }
};

export { deleteListing };
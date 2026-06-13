import type { SupabaseClient } from "@supabase/supabase-js";

const deleteAccount = async (userID: string, supabase: SupabaseClient) => {
  const { data, error } = await supabase.functions.invoke("delete-user-account", {
    body: { userID },
  });

  if (error) {
    console.error("Delete account execution error:", error);
    throw new Error(error.message || "Delete failed");
  }

  return data; // { ok: true, userID }
};

export { deleteAccount };
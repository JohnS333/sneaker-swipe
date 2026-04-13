import type { SupabaseClient, User } from "@supabase/supabase-js";
import "server-only";

export async function ensureUserRow(supabase: SupabaseClient, user: User) {
    console.log("Ensuring user row exists for user:", user.email);
  const row = {
    userID: user.id,
    email: user.email ?? null,
    preferenceVectorID: user.id,
  };

  const { error } = await supabase
    .from("users")
    .upsert(row, { onConflict: "userID" });

  if (error) throw error;
}

//RLS is enabled on users table. Users can CRUD only their own row.
import Main from "@/components/main";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
    // tutorial data fetch.
  // const { data: todos } = await supabase.from('todos').select()

  const username =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ??
    null;

  return <Main isSignedIn={!!user} username={username} />;
}

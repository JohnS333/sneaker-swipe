import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ensureUserRow } from "@/lib/supabase/ensure-user-row";



export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth=missing_code`);
  }

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;

    if (data.user) {
      console.log("User authenticated, calling ensureUserRow", data.user.email);
      await ensureUserRow(supabase, data.user);
    }

    return NextResponse.redirect(`${origin}/`);
  } catch (error) {
    console.error("Auth callback failed:", error);
    return NextResponse.redirect(`${origin}/?auth=failed`);
  }
}
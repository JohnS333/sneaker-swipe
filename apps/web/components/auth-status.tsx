"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient as createBrowserClient } from "@/utils/supabase/client";

type AuthStatusProps = {
  username: string;
};

export default function AuthStatus({ username }: AuthStatusProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.refresh(); // refresh Server Components so isSignedIn updates
    setLoading(false);
  };

  return (
    <div className="fixed top-4 right-4 z-[90] rounded-lg border border-black/10 bg-white/95 px-3 py-2 shadow-md backdrop-blur">
      <p className="text-xs text-neutral-600">Signed in as</p>
      <p className="max-w-[220px] truncate text-sm font-semibold">{username}</p>
      <button
        onClick={handleLogout}
        disabled={loading}
        className="mt-2 w-full rounded-md bg-black px-2 py-1.5 text-xs font-medium text-white disabled:opacity-60"
      >
        {loading ? "Logging out..." : "Logout"}
      </button>
    </div>
  );
}
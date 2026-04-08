"use client";

import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import AuthStatus from "@/components/auth-status";
import PillSelector, { type Tab } from "@/components/pill-selector";
import SwipeCards from "@/components/swipe-cards";
import Listings from "@/components/listings";
import { createClient as createBrowserClient } from "@/utils/supabase/client";

const BG_STYLE = {
  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke-width='2' stroke='%23d4d4d4'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
};

export default function Main({
  isSignedIn,
  username,
}: {
  isSignedIn: boolean;
  username: string | null;
}) {
  const [tab, setTab] = useState<Tab>("explore");

  const signInModal = !isSignedIn && (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm pointer-events-auto">
      <div className="grid min-h-full place-items-center p-6">
        <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
          <h1 className="text-2xl font-semibold">Welcome to SneakerSwipe</h1>
          <button
            onClick={continueWithGoogle}
            className="mt-5 w-full rounded-md bg-black px-4 py-2 text-white"
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );

  if (tab === "explore") {
    return (
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarTrigger className="fixed top-4 z-30 size-14 transition-[left] duration-200 ease-linear left-8 md:left-4 md:peer-data-[state=expanded]:left-[calc(var(--sidebar-width)-1rem)] [&>svg]:size-8" />
        <div
          className="flex flex-col flex-1 min-h-[100svh] bg-neutral-100 touch-none select-none overflow-hidden"
          style={BG_STYLE}
        >
          {isSignedIn && username && <AuthStatus username={username} />}
          <PillSelector tab={tab} onTabChange={setTab} />
          <SwipeCards />
          {signInModal}
        </div>
      </SidebarProvider>
    );
  }

  return (
    <div
      className="min-h-[100svh] w-full bg-neutral-100"
      style={BG_STYLE}
    >
      {isSignedIn && username && <AuthStatus username={username} />}
      <PillSelector tab={tab} onTabChange={setTab} />
      <Listings />
      {signInModal}
    </div>
  );
}

async function continueWithGoogle() {
  const supabase = createBrowserClient();
  supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

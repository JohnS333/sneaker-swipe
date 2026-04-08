"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { createClient as createBrowserClient } from "@/utils/supabase/client";

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  idle: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    transition: {
      borderRadius: { delay: 0.3, duration: 0.12, ease: "easeIn" },
      width: { delay: 0.2, duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
      height: { delay: 0.2, duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
    },
  },
  expanded: {
    width: 230,
    height: 108,
    borderRadius: 12,
    transition: {
      borderRadius: { duration: 0.08, ease: "easeOut" },
      width: { delay: 0.06, duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
      height: { delay: 0.06, duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
    },
  },
};

const iconVariants = {
  idle: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: { delay: 0.45, duration: 0.2, ease: "easeOut" },
  },
  expanded: {
    opacity: 0,
    rotate: 180,
    scale: 0.4,
    transition: { duration: 0.1, ease: "easeIn" },
  },
};

const contentVariants = {
  idle: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
  expanded: {
    opacity: 1,
    transition: { delay: 0.52, duration: 0.2, ease: "easeOut" },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

type AuthStatusProps = {
  username: string;
};

export default function AuthStatus({ username }: AuthStatusProps) {
  const [hovered, setHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
    setLoading(false);
  };

  return (
    <motion.div
      className="fixed top-4 right-4 z-[90] bg-white shadow-md border border-black/10 backdrop-blur overflow-hidden"
      variants={containerVariants}
      initial="idle"
      animate={hovered ? "expanded" : "idle"}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* Idle icon */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        variants={iconVariants}
      >
        <User className="h-5 w-5 text-neutral-800" strokeWidth={1.75} />
      </motion.div>

      {/* Expanded card content */}
      <motion.div
        className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none"
        variants={contentVariants}
      >
        <div>
          <p className="text-xs text-neutral-500">Signed in as</p>
          <p className="max-w-[206px] truncate text-sm font-semibold text-neutral-900">
            {username}
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loading}
          // re-enable pointer events only for the button
          className="pointer-events-auto w-full rounded-md bg-neutral-900 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
        >
          {loading ? "Logging out…" : "Logout"}
        </button>
      </motion.div>
    </motion.div>
  );
}

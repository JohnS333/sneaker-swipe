"use client";

import { motion } from "framer-motion";

export type Tab = "explore" | "listings";

export default function PillSelector({
  tab,
  onTabChange,
}: {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  return (
    <div className="flex justify-center pt-6 pb-4">
      <div className="relative flex items-center rounded-full bg-neutral-200 p-1 gap-1">
        {(["explore", "listings"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className="relative z-10 px-6 py-1.5 text-sm font-medium capitalize transition-colors duration-200"
            style={{ color: tab === t ? "#fff" : "#737373" }}
          >
            {tab === t && (
              <motion.span
                layoutId="pill-active"
                className="absolute inset-0 rounded-full bg-neutral-800"
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                style={{ zIndex: -1 }}
              />
            )}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

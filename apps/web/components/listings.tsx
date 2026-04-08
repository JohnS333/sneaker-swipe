"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import ListingCard, { type Listing } from "@/components/listing-card";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_LISTINGS: Listing[] = [
  {
    id: "mock-1",
    brand: "Nike",
    name: "Air Force 1 '07 White",
    type: "sneakers",
    size: 9.5,
    price: 65.99,
    image:
      "https://images.stockx.com/images/Nike-Air-Force-1-07-White-Product.jpg",
  },
  {
    id: "mock-2",
    brand: "Nike",
    name: "Dunk Low Panda",
    type: "sneakers",
    size: 11,
    price: 113.99,
    image:
      "https://images.stockx.com/images/Nike-Dunk-Low-Retro-White-Black-2021-Product.jpg?fit=fill&bg=FFFFFF&w=700&h=500&fm=webp&auto=compress&q=90&dpr=2&trim=color&updated_at=1738193358",
  },
  {
    id: "mock-3",
    brand: "Nike",
    name: "Blazer Mid '77 Vintage",
    type: "high-tops",
    size: 8,
    price: 129.99,
    image:
      "https://images.stockx.com/images/Nike-Blazer-Mid-77-Vintage-White-Black-Product.jpg",
  },
  {
    id: "mock-4",
    brand: "Nike",
    name: "Air Max 97 Silver Bullet",
    type: "running shoes",
    size: 10.5,
    price: 97.99,
    image:
      "https://images.stockx.com/images/Nike-Air-Max-97-Silver-Bullet-2016-Product.jpg",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Listings() {
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS);
  const [creating, setCreating] = useState(false);

  const handleCreate = (data: Omit<Listing, "id">) => {
    const newListing: Listing = { ...data, id: crypto.randomUUID() };
    console.log(
      "TODO: Persist new listing via Supabase edge function",
      newListing
    );
    setListings((prev) => [newListing, ...prev]);
    setCreating(false);
  };

  const handleUpdate = (id: string, data: Omit<Listing, "id">) => {
    console.log("TODO: Update listing via Supabase edge function", id, data);
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...data, id } : l))
    );
  };

  const handleDelete = (id: string) => {
    console.log("TODO: Delete listing via Supabase edge function", id);
    setListings((prev) => prev.filter((l) => l.id !== id));
  };

  const isEmpty = listings.length === 0 && !creating;

  return (
    <div className="w-full px-6 py-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          className="mb-6 flex items-center justify-between"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-semibold text-neutral-900">
              My Listings
            </h2>
            <motion.span
              key={listings.length}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600"
            >
              {listings.length}
            </motion.span>
          </div>

          <motion.button
            onClick={() => setCreating(true)}
            disabled={creating}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            New Listing
          </motion.button>
        </motion.div>

        {/* Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {creating && (
              <ListingCard
                key="new-card"
                listing={null}
                onSave={handleCreate}
                onDelete={() => setCreating(false)}
                index={0}
              />
            )}
            {listings.map((listing, i) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onSave={(data) => handleUpdate(listing.id, data)}
                onDelete={() => handleDelete(listing.id)}
                index={i + (creating ? 1 : 0)}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty state */}
        <AnimatePresence>
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="mt-20 flex flex-col items-center gap-2 text-center"
            >
              <p className="text-sm text-neutral-400">No listings yet</p>
              <p className="text-xs text-neutral-300">
                Your listed shoes will appear here
              </p>
              <motion.button
                onClick={() => setCreating(true)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mt-3 flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
              >
                <Plus className="h-4 w-4" />
                Add your first listing
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

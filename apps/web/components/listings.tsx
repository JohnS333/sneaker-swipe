"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import ListingCard, { type Listing } from "@/components/listing-card";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { deleteListing, fetchUserListings, updateListingsCache, upsertListing } from "@/lib/supabase/listings-functions-proxy";

const supabase = createBrowserClient();
const { data } = await supabase.auth.getUser();
const userID = data?.user?.id;
console.log("Current user ID:", userID);


// ─── Component ────────────────────────────────────────────────────────────────

export default function Listings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userID) {
      setLoading(false);
      return;
    }
    fetchUserListings(supabase, userID)
      .then(setListings)
      .catch((err) => console.error("Failed to fetch listings:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (data: Omit<Listing, "listingID">) => {
    const newListing: Listing = { ...data, listingID: crypto.randomUUID() };
    try {
      console.log("Inserting new listing into Supabase:", newListing);
      const response = await upsertListing(newListing, supabase);
      console.log("Supabase response:", response);
    } catch (error) {
      console.error("Error creating listing on database:", error);
    }

    setListings((prev) => {
      const next = [newListing, ...prev];
      updateListingsCache(next);
      return next;
    });
    setCreating(false);
  };

  const handleUpdate = (listingID: string, data: Omit<Listing, "listingID">) => {
    console.log("TODO: Update listing via Supabase edge function", listingID, data);
    setListings((prev) =>
      prev.map((l) => (l.listingID === listingID ? { ...data, listingID } : l))
    );
  };

  const handleDelete = async (listingID: string) => {
    console.log("TODO: Delete listing via Supabase edge function", listingID);
    try {
      await deleteListing(listingID, supabase);
      setListings((prev) => {
        const next = prev.filter((l) => l.listingID !== listingID);
        updateListingsCache(next);
        return next;
      });
    } catch (error) {
      console.error("Error deleting listing from database:", error);
    }
  };

  const isEmpty = listings.length === 0 && !creating && !loading;

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
          {loading && (
            <>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[200px] animate-pulse rounded-xl border border-neutral-200 bg-neutral-100"
                />
              ))}
            </>
          )}
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
                key={listing.listingID}
                listing={listing}
                onSave={(data) => handleUpdate(listing.listingID, data)}
                onDelete={() => handleDelete(listing.listingID)}
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

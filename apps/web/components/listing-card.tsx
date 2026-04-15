"use client";

import React, { useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { Camera, Check, Edit2, Trash2, X } from "lucide-react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

const supabase = createBrowserClient();


const { data } = await supabase.auth.getUser();
const userID = data?.user?.id;


// ─── Types ────────────────────────────────────────────────────────────────────

export interface Listing {
  listingID: string;
  brand: string;
  name: string;
  type: string;
  size: number;
  price: number;
  imageURL: string;
  listerUID?: string;
  description?: string;
}

const SHOE_TYPES = [
  "sneakers",
  "running shoes",
  "high-tops",
  "boots",
  "sandals",
  "dress shoes",
  "casual",
  "skateboarding",
  "basketball",
] as const;

// ─── Form helpers ─────────────────────────────────────────────────────────────

interface FormValues {
  brand: string;
  name: string;
  type: string;
  size: string;
  price: string;
}

const emptyForm = (): FormValues => ({
  brand: "",
  name: "",
  type: "sneakers",
  size: "",
  price: "",
});

const fromListing = (l: Listing): FormValues => ({
  brand: l.brand,
  name: l.name,
  type: l.type,
  size: String(l.size),
  price: String(l.price),
});

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm " +
  "text-neutral-800 placeholder:text-neutral-400 focus:outline-none " +
  "focus:ring-1 focus:ring-neutral-400 transition-shadow";

// ─── View face ────────────────────────────────────────────────────────────────

interface ViewFaceProps {
  listing: Listing;
  onEdit: () => void;
  onDelete: () => void;
}

function ViewFace({ listing, onEdit, onDelete }: ViewFaceProps) {
  return (
    <div className="flex h-full">
      <div className="relative w-[38%] flex-shrink-0 overflow-hidden border-r border-neutral-200 bg-neutral-50">
        {listing.imageURL ? (
          <motion.img
            src={listing.imageURL}
            alt={listing.name}
            draggable={false}
            className="h-full w-full object-contain"
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Camera className="h-7 w-7 text-neutral-300" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3">
        <p className="truncate text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          {listing.brand}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold leading-snug text-neutral-900">
          {listing.name}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-neutral-400">
          {listing.type}
        </p>

        <div className="mt-auto">
          <p className="text-[11px] text-neutral-500">Size {listing.size}</p>
          <p className="text-lg font-bold leading-none text-neutral-900">
            ${listing.price.toFixed(2)}
          </p>
          <div className="mt-2 flex gap-1.5">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onEdit}
              className="flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-[11px] text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            >
              <Edit2 className="h-3 w-3" />
              Edit
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onDelete}
              className="flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[11px] text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Form face ────────────────────────────────────────────────────────────────

interface FormFaceProps {
  form: FormValues;
  imagePreview: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onField: (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onImageClick: () => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onCancel: () => void;
}

function FormFace({
  form,
  imagePreview,
  fileInputRef,
  onField,
  onImageClick,
  onImageChange,
  onSave,
  onCancel,
}: FormFaceProps) {
  return (
    <div className="flex h-full select-auto">
      <button
        type="button"
        onClick={onImageClick}
        className="group relative flex w-[38%] flex-shrink-0 flex-col items-center justify-center gap-1.5 border-r border-neutral-200 bg-neutral-50 transition-colors hover:bg-neutral-100"
      >
        {imagePreview ? (
          <>
            <img
              src={imagePreview}
              alt="Preview"
              className="h-full w-full object-contain"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-l-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
            </div>
          </>
        ) : (
          <>
            <Camera className="h-5 w-5 text-neutral-400 transition-colors group-hover:text-neutral-600" />
            <span className="px-2 text-center text-[11px] leading-tight text-neutral-400 transition-colors group-hover:text-neutral-600">
              Upload photo
            </span>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onImageChange}
        />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2.5">
        <input
          placeholder="Brand"
          value={form.brand}
          onChange={onField("brand")}
          className={`${inputCls} font-semibold`}
        />
        <input
          placeholder="Name"
          value={form.name}
          onChange={onField("name")}
          className={inputCls}
        />
        <select
          value={form.type}
          onChange={onField("type")}
          className={`${inputCls} text-xs`}
        >
          {SHOE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5">
          <input
            placeholder="Size"
            type="number"
            step="0.5"
            min="1"
            value={form.size}
            onChange={onField("size")}
            className={`${inputCls} max-w-2/5 flex-shrink-0`}
          />
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
              $
            </span>
            <input
              placeholder="0.00"
              type="number"
              step="1"
              min="0"
              value={form.price}
              onChange={onField("price")}
              className={`${inputCls} pl-5`}
            />
          </div>
        </div>
        <div className="mt-auto flex gap-1.5">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onSave}
            className="flex flex-1 items-center justify-center gap-1 rounded-md bg-neutral-900 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-neutral-700"
          >
            <Check className="h-3 w-3" />
            Save
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onCancel}
            className="flex flex-1 items-center justify-center gap-1 rounded-md border border-neutral-200 py-1.5 text-[11px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            <X className="h-3 w-3" />
            Cancel
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ─── Main card component ──────────────────────────────────────────────────────

interface ListingCardProps {
  listing: Listing | null;
  onSave: (data: Omit<Listing, "listingID">) => void;
  onDelete: () => void;
  index?: number;
}

export default function ListingCard({
  listing,
  onSave,
  onDelete,
  index = 0,
}: ListingCardProps) {
  const isNew = listing === null;

  const [showForm, setShowForm] = useState(isNew);
  const [form, setForm] = useState<FormValues>(() =>
    isNew ? emptyForm() : fromListing(listing)
  );
  const [imagePreview, setImagePreview] = useState<string>(
    listing?.imageURL ?? ""
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const controls = useAnimation();

  const flipTo = async (toForm: boolean, setup?: () => void) => {
    await controls.start({
      scaleY: 0,
      transition: { duration: 0.15, ease: "easeIn" },
    });
    setup?.();
    setShowForm(toForm);
    await controls.start({
      scaleY: 1,
      transition: { duration: 0.15, ease: "easeOut" },
    });
  };

  const handleEdit = () =>
    flipTo(true, () => {
      setForm(listing ? fromListing(listing) : emptyForm());
      setImagePreview(listing?.imageURL ?? "");
    });

  const handleCancel = () => {
    if (isNew) {
      onDelete();
    } else {
      flipTo(false);
    }
  };

  const handleSave = () => {
    const data: Omit<Listing, "listingID"> = {
      brand: form.brand,
      name: form.name,
      type: form.type,
      size: parseFloat(form.size) || 0,
      price: parseFloat(form.price) || 0,
      imageURL: imagePreview,
      listerUID: userID || undefined,
    };
    console.log(
      isNew
        ? "TODO: Create listing via Supabase edge function"
        : "TODO: Update listing via Supabase edge function",
      data
    );
    onSave(data);
    if (!isNew) flipTo(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log("TODO: Upload image to Supabase storage via edge function", file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onField =
    (key: keyof FormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.18 } }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      whileHover={!showForm ? { y: -3, transition: { duration: 0.15 } } : undefined}
      className="h-[200px]"
    >
      <motion.div
        animate={controls}
        style={{ originY: 0.5 }}
        className="h-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
      >
        {showForm ? (
          <FormFace
            form={form}
            imagePreview={imagePreview}
            fileInputRef={fileInputRef}
            onField={onField}
            onImageClick={() => fileInputRef.current?.click()}
            onImageChange={handleImageChange}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <ViewFace
            listing={listing!}
            onEdit={handleEdit}
            onDelete={onDelete}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

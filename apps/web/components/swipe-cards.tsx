"use client";

import React, { useMemo, useState } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { ShoppingBag, Trash } from "lucide-react";
import { useCart } from "@/components/cart-context";
import data from "@data/seeds/shoes.json";

interface CardItem {
  id: number;
  brand: string;
  name: string;
  size: number;
  type: string;
  image: string;
  price: number;
}

const ALL_CARDS: CardItem[] = data;

function shuffled(arr: CardItem[]): CardItem[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function SwipeCards() {
  const [cards, setCards] = useState<CardItem[]>(() => shuffled(ALL_CARDS));
  const { addItem } = useCart();

  const top = cards[cards.length - 1] ?? null;
  const rest = useMemo(() => cards.slice(0, -1), [cards]);

  const reset = () => setCards(shuffled(ALL_CARDS));
  const removeTop = () => setCards((prev) => prev.slice(0, -1));

  const handleSwipe = (direction: 1 | -1) => {
    if (!top) return;
    if (direction === 1) {
      addItem({
        id: top.id,
        brand: top.brand,
        name: top.name,
        size: top.size,
        type: top.type,
        image: top.image,
        price: top.price,
      });
    }
    removeTop();
  };

  return (
    <div className="grid place-items-center" style={{ minHeight: "calc(100svh - 80px)" }}>
      <div className="relative h-[42rem] w-[32rem]">
        {rest.slice(-2).map((c, idx) => (
          <motion.div
            key={c.id}
            className="absolute inset-0 rounded-lg bg-white shadow-lg"
            style={{
              transform: `translateY(${(rest.length - (rest.length - 2 + idx)) * 6}px) scale(${
                0.98 - (rest.length - (rest.length - 2 + idx)) * 0.01
              })`,
            }}
          >
            <img
              src={c.image}
              alt=""
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className="h-full w-full rounded-lg object-contain pointer-events-none"
            />
          </motion.div>
        ))}

        <AnimatePresence>
          {top ? (
            <SwipeableCard key={top.id} card={top} onSwipe={handleSwipe} />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 grid place-items-center rounded-lg border border-neutral-300 bg-white"
            >
              <button
                onClick={reset}
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
              >
                Reset deck
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SwipeableCard({
  card,
  onSwipe,
}: {
  card: CardItem;
  onSwipe: (direction: 1 | -1) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-14, 14]);
  const likeStrength = useTransform(x, [8, 140], [0, 1]);
  const nopeStrength = useTransform(x, [-8, -140], [0, 1]);
  const likeScale = useTransform(x, [8, 140], [0.75, 1.15]);
  const nopeScale = useTransform(x, [-8, -140], [0.75, 1.15]);
  const likeTint = useTransform(
    x,
    [8, 140],
    ["rgba(16, 185, 129, 0)", "rgba(16, 185, 129, 0.4)"]
  );
  const nopeTint = useTransform(
    x,
    [-8, -140],
    ["rgba(239, 68, 68, 0)", "rgba(239, 68, 68, 0.4)"]
  );

  const [dir, setDir] = React.useState<1 | -1>(1);
  const swipeThreshold = 120;

  return (
    <motion.div
      className="absolute inset-0 rounded-lg bg-white shadow-xl hover:cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.25}
      custom={dir}
      onDragStart={(e) => e.preventDefault()}
      onDragEnd={() => {
        const v = x.get();
        if (v > swipeThreshold) {
          setDir(1);
          onSwipe(1);
        } else if (v < -swipeThreshold) {
          setDir(-1);
          onSwipe(-1);
        }
      }}
      initial={{ opacity: 1, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{
        opacity: 0,
        x: dir > 0 ? 500 : -500,
        rotate: dir > 0 ? 18 : -18,
        transition: { duration: 0.18 },
      }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-lg">
        <img
          src={card.image}
          alt=""
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className="h-full w-full object-contain pointer-events-none"
        />
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/75 via-black/40 to-transparent p-4 text-white">
          <p className="text-xs uppercase tracking-wide text-white/80">{card.brand} • {card.type}</p>
          <h3 className="text-lg font-semibold leading-tight">{card.name} • Size: {card.size} </h3> 
          <p className="mt-1 text-sm font-medium">${card.price.toFixed(2)}</p>
        </div>

        <motion.div
          style={{ opacity: likeStrength, backgroundColor: likeTint }}
          className="pointer-events-none absolute inset-0"
        >
          <motion.div
            style={{ scale: likeScale }}
            className="grid h-full w-full place-items-center"
          >
            <ShoppingBag
              strokeWidth={2.8}
              className="h-28 w-28 text-emerald-500 drop-shadow-[0_8px_24px_rgba(16,185,129,0.45)]"
            />
          </motion.div>
        </motion.div>

        <motion.div
          style={{ opacity: nopeStrength, backgroundColor: nopeTint }}
          className="pointer-events-none absolute inset-0"
        >
          <motion.div
            style={{ scale: nopeScale }}
            className="grid h-full w-full place-items-center"
          >
            <Trash
              strokeWidth={2.8}
              className="h-28 w-28 text-red-500 drop-shadow-[0_8px_24px_rgba(239,68,68,0.45)]"
            />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

"use client";

import React, { useMemo, useState } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";

interface CardItem {
  id: number;
  url: string;
}


const INITIAL_CARDS: CardItem[] = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2370&auto=format&fit=crop",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1512374382149-233c42b6a83b?q=80&w=2235&auto=format&fit=crop",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=2342&auto=format&fit=crop",
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2224&auto=format&fit=crop",
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?q=80&w=2340&auto=format&fit=crop",
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1570464197285-9949814674a7?q=80&w=2273&auto=format&fit=crop",
  },
  {
    id: 7,
    url: "https://images.unsplash.com/photo-1578608712688-36b5be8823dc?q=80&w=2187&auto=format&fit=crop",
  },
  {
    id: 8,
    url: "https://images.unsplash.com/photo-1505784045224-1247b2b29cf3?q=80&w=2340&auto=format&fit=crop",
  },
];

export default function SwipeCards() {
  const [cards, setCards] = useState<CardItem[]>(INITIAL_CARDS);

  const top = cards[cards.length - 1] ?? null;
  const rest = useMemo(() => cards.slice(0, -1), [cards]);

  const reset = () => setCards(INITIAL_CARDS);

  const removeTop = () => setCards((prev) => prev.slice(0, -1));

  return (
    <div
      className="grid h-[520px] w-full place-items-center bg-neutral-100 touch-none select-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke-width='2' stroke='%23d4d4d4'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
      }}
    >
      <div className="relative h-96 w-72">
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
              src={c.url}
              alt=""
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className="h-full w-full rounded-lg object-cover pointer-events-none"
            />
          </motion.div>
        ))}

        <AnimatePresence>
          {top ? (
            <SwipeableCard
              key={top.id}
              card={top}
              onSwipe={() => removeTop()}
            />
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
  card: { id: number; url: string };
  onSwipe: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-14, 14]);
  const likeOpacity = useTransform(x, [30, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, -30], [1, 0]);

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
          onSwipe();
        } else if (v < -swipeThreshold) {
          setDir(-1);
          onSwipe();
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
          src={card.url}
          alt=""
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className="h-full w-full object-cover pointer-events-none"
        />

        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute left-4 top-4 rounded-md border border-emerald-500 bg-white/80 px-3 py-1 text-sm font-semibold text-emerald-600"
        >
          LIKE
        </motion.div>

        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute right-4 top-4 rounded-md border border-rose-500 bg-white/80 px-3 py-1 text-sm font-semibold text-rose-600"
        >
          NOPE
        </motion.div>
      </div>
    </motion.div>
  );
}

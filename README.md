# Swipe Buy

A shoe marketplace where users swipe right to add items to their cart — think Tinder for sneakers. Built as a monorepo housing the frontend, API layer, and ML recommendation service.

## Monorepo Structure

```
/
├── apps/
│   └── web/              # Next.js 16 frontend (React 19, Tailwind 4, shadcn/ui)
│       ├── app/
│       │   ├── api/      # Next.js API routes
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── components/   # App components + shadcn/ui primitives
│       ├── hooks/
│       └── lib/
├── services/
│   └── recommender/      # Python ML service (sentence-transformers + Qdrant)
├── data/
│   └── seeds/            # Shared seed data (shoes.json)
└── package.json          # npm workspace root
```

## Getting Started

From the repo root:

```bash
npm install
npm run dev       # starts apps/web on http://localhost:3000
```

To run the recommender service:

```bash
cd services/recommender
pip install -r requirements.txt
python main.py
```

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| UI Components | shadcn/ui, Radix UI, Framer Motion |
| ML Service | Python, sentence-transformers, Qdrant |
| Database | Supabase (Postgres + Auth) |

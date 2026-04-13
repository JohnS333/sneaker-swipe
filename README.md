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

See [Recommender Service](#recommender-service) below for Docker build and run instructions.

## Recommender Service

The recommender service is a FastAPI + Qdrant vector database packaged as a single Docker image. It exposes an HTTP API for embedding product text and running semantic similarity searches.

> **Important:** all `docker build` and `docker run` commands must be run from the **repo root** — the Dockerfile copies `requirements.txt` and `services/recommender/Qdrant/` relative to that context.

---

### Build

```bash
# Apple Silicon Mac (M1/M2/M3/M4)
# Required: the Qdrant binary inside the image is x86_64 only.
# --load is needed to pull the image into your local Docker daemon when using buildx.
docker buildx build \
  --platform linux/amd64 \
  --load \
  -f services/recommender/Dockerfile \
  -t swipe-buy-recommender \
  .

# Intel Mac / Linux x86_64 / Windows (Docker Desktop + WSL2)
docker build \
  -f services/recommender/Dockerfile \
  -t swipe-buy-recommender \
  .
```

> **First build time:** `sentence-transformers` pulls PyTorch, making the image ~8 GB. Expect 10–20 minutes on a slow connection. Subsequent builds are fast thanks to layer caching.

---

### Run

**With persistent Qdrant storage** (recommended):

```bash
# Mac / Linux
docker run -d \
  -p 1269:8000 \
  -e QDRANT_URL=http://localhost:6333 \
  -v ~/qdrant/storage:/qdrant/storage \
  --name recommender \
  swipe-buy-recommender

# Windows (Docker Desktop)
docker run -d \
  -p 1269:8000 \
  -e QDRANT_URL=http://localhost:6333 \
  -v C:\qdrant\storage:/qdrant/storage \
  --name recommender \
  swipe-buy-recommender

# Apple Silicon — add the platform flag to either command above
  --platform linux/amd64 \
```

The API will be available at `http://localhost:1269` once the container prints `Qdrant is ready.` and `Model loaded successfully.`

> **Note:** always pass `-e QDRANT_URL=http://localhost:6333` explicitly. The hardcoded fallback in the source incorrectly uses `https://` and will fail to connect without this flag.

---

### Quick smoke test (no persistence, foreground)

Useful for verifying the image built correctly before committing to a persistent run:

```bash
docker run --rm \
  -p 1269:8000 \
  -e QDRANT_URL=http://localhost:6333 \
  --name recommender-test \
  swipe-buy-recommender
```

Once running, test the endpoints:

```bash
# Health check
curl http://localhost:1269/health

# Add a vector
curl -X POST http://localhost:1269/add-vector \
  -H "Content-Type: application/json" \
  -d '[{"id":"550e8400-e29b-41d4-a716-446655440000","text":"red running shoes for men","metadata":{"product_id":"test-001"}}]'

# Semantic search
curl -X POST http://localhost:1269/search \
  -H "Content-Type: application/json" \
  -d '{"query_text":"athletic footwear","top_n":3}'
```

---

### Platform reference

| Host | Platform flag required | Volume path |
|------|----------------------|-------------|
| Mac Apple Silicon | Yes (`--platform linux/amd64`) | `~/qdrant/storage` |
| Mac Intel | No | `~/qdrant/storage` |
| Linux x86_64 | No | `~/qdrant/storage` |
| Windows (Docker Desktop) | No | `C:\qdrant\storage` |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| UI Components | shadcn/ui, Radix UI, Framer Motion |
| ML Service | Python, sentence-transformers, Qdrant |
| Database | Supabase (Postgres + Auth) |

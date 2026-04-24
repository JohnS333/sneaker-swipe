import os
import uuid
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer
from Qdrant.Qdrant_man import Qdrant_Manager

app = FastAPI(title="Vector Recommendation API")

# 1. Setup Middleware
origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Initialize Components
qdrant_url = os.environ.get("QDRANT_URL", "http://localhost:6333")
qdrant = Qdrant_Manager(url=qdrant_url, name="vector_embeddings")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# 3. Pydantic Models
class TextItem(BaseModel):
    id: uuid.UUID
    text: str 
    metadata: Dict[str, Any] = Field(default_factory=dict)

class SearchRequest(BaseModel):
    query_text: Optional[str] = None      # For text-based search
    query_vector: Optional[List[float]] = None # For direct vector-based search
    top_n: int = 5

class VectorItem(BaseModel):
    id: uuid.UUID
    vector: List[float] 
    metadata: Dict[str, Any] = Field(default_factory=dict)

# --- Routes ---

@app.on_event("startup")
async def startup_event():
    qdrant.set_up()

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/add-vector")
async def add_vector(items: List[TextItem]):
    try:
        ids = [str(item.id) for item in items]
        texts = [item.text for item in items]
        vectors = embedder.encode(texts).tolist()
        
        payloads = []
        for item in items:
            payload = item.metadata.copy()
            payload["original_text"] = item.text  
            payloads.append(payload)
            
        qdrant.add_points(vectors, ids, payloads)
        return {"message": f"Successfully added {len(ids)} vectors"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/add-vector-raw")
async def add_vector_raw(items: List[VectorItem]):
    try:
        ids = [str(item.id) for item in items]
        vectors = [item.vector for item in items]
        payloads = [item.metadata for item in items]
        
        # Qdrant's upsert will add new IDs and overwrite existing ones
        qdrant.add_points(vectors, ids, payloads)
        
        return {"message": f"Successfully added/updated {len(ids)} vectors"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")    
async def search_vector(request: SearchRequest):
    try:
        # Step 1: Resolve the vector
        if request.query_vector:
            final_vector = request.query_vector
        elif request.query_text:
            final_vector = embedder.encode(request.query_text).tolist()
        else:
            raise HTTPException(status_code=400, detail="Provide query_text or query_vector")
        
        # Step 2: Query Manager
        results = qdrant.query(final_vector, n=request.top_n)
        
        # Step 3: Format response
        return {
            "results": [
                {
                    "id": res.id,
                    "score": res.score,
                    "payload": res.payload
                } for res in results
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/vector/{vector_id}")
async def get_vector_by_id(vector_id: uuid.UUID):
    try:
        result = qdrant.query_by_ID(vector_id)
        if not result:
            raise HTTPException(status_code=404, detail="ID not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/remove-vector/{vector_id}")
async def remove_vector(vector_id: uuid.UUID):
    try:
        qdrant.delete([str(vector_id)])
        return {"message": f"Vector {vector_id} removed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class UserRecommendRequest(BaseModel):
    listing_ids: List[uuid.UUID]       # IDs of listings to build preference vector from
    exclude_ids: List[uuid.UUID] = []  # IDs to exclude from results (e.g. already ordered)
    top_n: int = 10

@app.post("/recommend/user")
async def recommend_for_user(request: UserRecommendRequest):
    if not request.listing_ids:
        raise HTTPException(status_code=400, detail="listing_ids must not be empty")

    try:
        # Fetch vectors for each listing from Qdrant
        vectors = []
        for listing_id in request.listing_ids:
            point = qdrant.query_by_ID(listing_id)
            if point and point.vector:
                vectors.append(point.vector)

        if not vectors:
            raise HTTPException(status_code=404, detail="No vectors found for provided listing_ids")

        # Build preference vector: recency-weighted average (most recent = highest weight)
        import numpy as np
        n = len(vectors)
        weights = [i + 1 for i in range(n)]  # [1, 2, ..., n] — last element is most recent
        preference_vector = np.average(vectors, axis=0, weights=weights).tolist()

        # Search Qdrant for similar listings
        results = qdrant.query(preference_vector, n=request.top_n + len(request.exclude_ids))

        # Filter out excluded IDs
        exclude_set = {str(eid) for eid in request.exclude_ids}
        filtered = [
            {"id": res.id, "score": res.score, "payload": res.payload}
            for res in results
            if str(res.id) not in exclude_set
        ][:request.top_n]

        return {"results": filtered}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
import os
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
from Qdrant.Qdrant_man import Qdrant_Manager

app = FastAPI()

# Production-Ready CORS Handling
# Defaults to localhost:3000 for local dev, but can be overridden in Docker
origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Initialize Manager and Embedder
qdrant_url = os.environ.get("QDRANT_URL", "http://localhost:6333")
qdrant = Qdrant_Manager(url=qdrant_url, name="vector_embeddings")

# Load the model once when the app starts
print("Loading SentenceTransformer model...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")
print("Model loaded successfully.")

# 3. Pydantic Models (Now expecting TEXT instead of raw floats)
class TextItem(BaseModel):
    id: uuid.UUID
    text: str 
    metadata: Dict[str, Any]

class SearchRequest(BaseModel):
    query_text: str 
    top_n: int = 5

# --- Routes ---

@app.on_event("startup")
async def startup_event():
    qdrant.set_up()

@app.get("/health")
async def health_check():
    """Simple endpoint so Docker knows the container is running"""
    return {"status": "healthy"}

@app.post("/add-vector")
async def add_vector(items: List[TextItem]):
    try:
        ids = [str(item.id) for item in items]
        texts = [item.text for item in items]
        
        # 1. Convert all text strings into vector floats at once
        # .tolist() converts the numpy arrays back to standard Python lists
        vectors = embedder.encode(texts).tolist()
        
        # 2. Inject the original text into the metadata payload so it's readable later
        payloads = []
        for item in items:
            payload = item.metadata.copy()
            payload["original_text"] = item.text  
            payloads.append(payload)
            
        # 3. Save to Qdrant
        qdrant.add_points(vectors, ids, payloads)
        return {"message": f"Successfully embedded and added {len(ids)} vectors"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")    
async def search_vector(request: SearchRequest):
    try:
        # 1. Turn the user's search query into a vector
        vectorized_query = embedder.encode(request.query_text).tolist()
        
        # 2. Search Qdrant
        results = qdrant.query(vectorized_query, n=request.top_n)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/remove-vector/{vector_id}")
async def remove_vector(vector_id: uuid.UUID): 
    try:
        qdrant.delete([str(vector_id)])
        return {"message": f"Vector {vector_id} removed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
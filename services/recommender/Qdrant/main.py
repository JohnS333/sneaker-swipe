from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from Qdrant.Qdrant_man import Qdrant_Manager

app = FastAPI()

# 1. Handle CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Initialize your Manager
qdrant = Qdrant_Manager(url="http://localhost:6333", name="vector_embeddings")

# 3. Pydantic Models for Input Validation
class VectorItem(BaseModel):
    id: str  
    vector: List[float]
    metadata: Dict[str, Any]

# --- Routes ---

@app.on_event("startup")
async def startup_event():
    qdrant.set_up()

@app.post("/add-vector")
async def add_vector(items: List[VectorItem]):
    try:
        ids = [item.id for item in items]
        vectors = [item.vector for item in items]
        payloads = [item.metadata for item in items]
        
        qdrant.add_points(vectors, ids, payloads)
        return {"message": f"Successfully added/updated {len(ids)} vectors"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")    #Acts as Read for CRUD
async def search_vector(user_vector: List[float], top_n: int = 5):
    try:
        results = qdrant.query(user_vector, n=top_n)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/remove-vector/{vector_id}")
async def remove_vector(vector_id: str): 
    try:
        qdrant.delete([vector_id])
        return {"message": f"Vector {vector_id} removed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
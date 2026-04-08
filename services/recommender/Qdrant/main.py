from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from Qdrant.Qdrant_man import Qdrant_Manager

app = FastAPI()

# 1. Handle CORS (So Next.js at localhost:3000 can call this)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Initialize your Manager
# In a real app, use environment variables for the URL
qdrant = Qdrant_Manager(url="http://localhost:6333", name="shoes_collection")

# 3. Pydantic Models for Input Validation
class ShoeItem(BaseModel):
    id: int
    vector: List[float]
    metadata: Dict[str, Any]

# --- Routes ---

@app.on_event("startup")
async def startup_event():
    # Automatically ensure the collection exists when the API starts
    qdrant.set_up()

@app.post("/add-shoes")
async def add_shoes(items: List[ShoeItem]):
    try:
        ids = [item.id for item in items]
        vectors = [item.vector for item in items]
        payloads = [item.metadata for item in items]
        
        qdrant.add_vectors(vectors, ids, payloads)
        return {"message": f"Successfully added {len(ids)} shoes"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search_shoes(user_vector: List[float], top_n: int = 5):
    try:
        # Calls your 'query' method from Qdrant_Manager
        results = qdrant.query(user_vector, n=top_n)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/remove-shoe/{shoe_id}")
async def remove_shoe(shoe_id: int):
    try:
        qdrant.delete([shoe_id])
        return {"message": f"Shoe {shoe_id} removed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
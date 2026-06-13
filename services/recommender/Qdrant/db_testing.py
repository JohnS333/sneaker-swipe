import json
import uuid
import os
from sentence_transformers import SentenceTransformer
from Qdrant_man import Qdrant_Manager

# 1. Setup & Initialization
print("--- Initializing Test Environment ---")
# Adjust URL if your Qdrant is running elsewhere
QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:6333")
qdrant = Qdrant_Manager(url=QDRANT_URL, name="shoe_store")

print("Loading SentenceTransformer (all-MiniLM-L6-v2)...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

def load_sample_data():
    with open('shoes.json', 'r') as f:
        return json.load(f)

def menu():
    print("\n--- QDRANT CRUD TEST MENU ---")
    print("1. Setup/Reset Collection")
    print("2. Add/Index All Shoes (Create)")
    print("3. Search by Text Query (Read)")
    print("4. Remove a Shoe by ID (Delete)")
    print("5. Exit")
    return input("Select an option: ")

def run_test():
    shoes = load_sample_data()
    
    while True:
        choice = menu()

        if choice == '1':
            # Simulates the @app.on_event("startup") logic
            qdrant.set_up(delete_old=True)
            print("Collection reset and ready.")

        elif choice == '2':
            # Simulates the @app.post("/add-vector") logic
            print(f"Embedding {len(shoes)} items...")
            
            # Prepare data
            texts = [f"{s['brand']} {s['name']} - {s['type']}" for s in shoes]
            vectors = embedder.encode(texts).tolist()
            
            # Create UUIDs and Payloads (mapping shoe int ID to a UUID)
            ids = [str(uuid.uuid5(uuid.NAMESPACE_DNS, str(s['id']))) for s in shoes]
            payloads = []
            for i, shoe in enumerate(shoes):
                p = shoe.copy()
                p["original_text"] = texts[i]
                payloads.append(p)

            qdrant.add_points(vectors, ids, payloads)
            print("Successfully indexed data.")

        elif choice == '3':
            # Simulates the @app.post("/search") logic
            query = input("Enter search terms (e.g., 'blue running shoes'): ")
            vectorized_query = embedder.encode(query).tolist()
            
            # In your Qdrant_man.py, with_payload is False by default. 
            # I'll keep it as is, but note you won't see text unless you change that file.
            results = qdrant.query(vectorized_query, n=3)
            print("\nSearch Results (Raw IDs/Scores):")
            print(results)

        elif choice == '4':
            # Simulates the @app.delete("/remove-vector/{vector_id}") logic
            raw_id = input("Enter the numeric shoe ID to remove (1-100): ")
            # Convert back to the UUID used during indexing
            target_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, raw_id))
            qdrant.delete([target_uuid])
            print(f"Vector {target_uuid} (Shoe #{raw_id}) removed.")

        elif choice == '5':
            break
        else:
            print("Invalid choice.")

if __name__ == "__main__":
    run_test()
from sentence_transformers import SentenceTransformer

class Embedder:
    def __init__(self, model="all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model)

    def create_embedding(self, item):
        embeddings = self.model.encode(item)
        return embeddings
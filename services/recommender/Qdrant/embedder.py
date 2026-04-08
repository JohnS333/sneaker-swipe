from sentence_transformers import SentenceTransformer

class Embedder:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)

    def embded(self, text):
        """Can provide both single or multiple values to embded"""
        return self.model.encode(text).tolist()
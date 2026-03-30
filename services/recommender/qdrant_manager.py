from qdrant_client import Distance, VectorParams, QdrantClient

class Qdrant_Manager:
    def __init__(self, url, name):
        self.client = QdrantClient(url=url)
        self.db_name = name

    def set_up(self, delet_old=False):   
        """
        Sets up collection
        if delete_old=True then it recreates the database
        size has to equal the dimension of the vectors (embedding model needs to match)
        """
        if delet_old:
            self.client.recreate_collection(
                collection_name=self.db_name,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE)
            )

            print(f"Collection {self.db_name} has been reset.")
        else:
            if not self.client.collection_exists(self.db_name):
                self.client.create_collection(
                    collection_name=self.db_name,
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
                )

                print(f"Collection {self.db_name} has been created.")

    def add_vectors(self, vectors, ids, payloads):
        """Uploads many vectors simultaneously"""
        self.client.upsert(
            collection_name=self.db_name,
            points=[
                {"id": idx, "vector": vec, "payload": pay}
                for idx, vec, pay in zip(ids, vectors, payloads)
            ]
        )
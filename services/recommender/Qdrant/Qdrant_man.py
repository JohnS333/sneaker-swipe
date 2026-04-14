from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, PointIdsList
from typing import List, Dict, Any
import uuid

class Qdrant_Manager:
    def __init__(self, url: str, name: str, vector_size: int = 384, distance_metric: Distance = Distance.COSINE):
        self.client = QdrantClient(url=url)
        self.db_name = name
        self.vector_size = vector_size
        self.distance_metric = distance_metric

    def set_up(self, delete_old=False):   
        """
        Sets up collection
        if delete_old=True then it recreates the database
        size has to equal the dimension of the vectors (embedding model needs to match)
        """
        if delete_old and self.client.collection_exists(collection_name=self.db_name):
            self.client.delete_collection(collection_name=self.db_name)
            print(f"Old collection '{self.db_name}' deleted.")

        # Create the collection if it doesn't already exist
        if not self.client.collection_exists(collection_name=self.db_name):
            self.client.create_collection(
                collection_name=self.db_name,
                vectors_config=VectorParams(size=self.vector_size, distance=self.distance_metric)
            )
            print(f"Collection '{self.db_name}' has been created.")
        else:
            print(f"Collection '{self.db_name}' already exists. Setup skipped.")

    def add_points(self, vectors: List[List[float]], ids: List[str], payloads: List[Dict[str, Any]]):
        """Uploads many vectors simultaneously"""
        points = [
            PointStruct(id=idx, vector=vec, payload=pay)
            for idx, vec, pay in zip(ids, vectors, payloads)
        ]
        
        self.client.upsert(
            collection_name=self.db_name,
            points=points
        )

    def query(self, user_vector: List[float], n: int):
        """Returns the id of the 'n'  vectors closest to the 'user_vector'"""
        return self.client.query_points(
            collection_name=self.db_name,
            query=user_vector,
            with_payload=False,
            limit=n
            )
    
    def query_by_ID(self, point_id: uuid.UUID):
        """Returns the vector whose point's id matches id"""
        result = self.client.retrieve(
            collection_name=self.db_name,
            ids=[str(point_id)],
            with_vectors=True
        )
        
        return result[0] if result else None
    
    def delete(self, points: List[str]):
        """Points can be a list of points, so we can delete more than one point at a time"""
        return self.client.delete(
            collection_name=self.db_name,
            points_selector=PointIdsList(points=points)
        )   

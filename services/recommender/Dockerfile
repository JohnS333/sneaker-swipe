FROM python:3.11-slim

ARG QDRANT_VERSION=1.14.0

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Download and install the Qdrant binary
RUN curl -fsSL \
    "https://github.com/qdrant/qdrant/releases/download/v${QDRANT_VERSION}/qdrant-x86_64-unknown-linux-musl.tar.gz" \
    | tar -xz -C /usr/local/bin

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Qdrant package (manager, embedder, main)
COPY services/recommender/Qdrant/ ./Qdrant/

COPY services/recommender/start.sh .
RUN chmod +x start.sh

# Qdrant data storage
RUN mkdir -p /qdrant/storage

# 8000 = FastAPI manager  |  6333 = Qdrant HTTP (internal, not exposed to host)
EXPOSE 8000

CMD ["./start.sh"]

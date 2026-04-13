#!/bin/sh
set -e

# Start Qdrant in the background, pointing at the persistent storage dir
QDRANT__STORAGE__STORAGE_PATH=/qdrant/storage qdrant &

# Wait until Qdrant's HTTP API is accepting requests
echo "Waiting for Qdrant to be ready..."
until curl -sf http://localhost:6333/healthz > /dev/null 2>&1; do
    sleep 1
done
echo "Qdrant is ready."

# Hand off to uvicorn (exec replaces the shell so signals are forwarded correctly)
exec uvicorn Qdrant.main:app --host 0.0.0.0 --port 8000

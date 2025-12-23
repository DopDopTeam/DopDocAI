import uvicorn
from fastapi import FastAPI

from backend.ingestion_service.routes import register_endpoints

app = FastAPI()

register_endpoints(app)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
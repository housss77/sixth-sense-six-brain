from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from agent import generate_sixth_sense_response


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryModel(BaseModel):
    query: str


@app.get("/")
def health_check():
    return {
        "service": "SIXth Sense Backend",
        "status": "running",
        "query_endpoint": "/api/query",
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)


@app.post("/api/query")
def query(payload: QueryModel):
    return generate_sixth_sense_response(payload.query)


@app.post("/api/bpo-submit")
def bpo_submit(payload: dict):
    print(f"📦 [MOCK SFTP] Transferring data to Master Data System: {payload}")
    return {
        "status": "success",
        "message": "Transmission accepted. BPO Officer notified via Master Data queue.",
    }


if __name__ == "__main__":
    print("🚀 Starting SIXth Sense Backend on http://127.0.0.1:5000")
    uvicorn.run(app, host="127.0.0.1", port=5000)

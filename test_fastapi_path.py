from fastapi import FastAPI
from fastapi.testclient import TestClient

app = FastAPI()

@app.get("/{full_path:path}")
def catch_all(full_path: str):
    return {"path": full_path}

client = TestClient(app)
print(client.get("/").json())
print(client.get("/test").json())

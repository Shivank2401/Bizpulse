from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Simple test server is running"}

@app.get("/test")
async def test():
    return {"status": "ok", "message": "Test endpoint working"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)

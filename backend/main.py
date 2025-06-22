from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from api.auth import router as auth_router
from api.users import router as users_router
from api.shipments import router as shipments_router

app = FastAPI(title="SilkRoute OS Declaration Helper", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://127.0.0.1:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1", tags=["authentication"])
app.include_router(users_router, prefix="/api/v1", tags=["users"])
app.include_router(shipments_router, prefix="/api/v1", tags=["shipments"])

@app.get("/")
async def root():
    return {"message": "SilkRoute OS Declaration Helper API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

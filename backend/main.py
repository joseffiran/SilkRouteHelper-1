from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import logging

from api.auth import router as auth_router
from api.users import router as users_router
from api.shipments import router as shipments_router
from api.documents import router as documents_router
from api.admin import router as admin_router
from api.declarations import router as declarations_router
from middleware.error_handler import ErrorHandlingMiddleware, RequestLoggingMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="SilkRoute OS Declaration Helper", 
    version="1.0.0",
    description="AI-powered customs declaration automation system"
)

# Add error handling middleware (first)
app.add_middleware(ErrorHandlingMiddleware)

# Add request logging middleware
app.add_middleware(RequestLoggingMiddleware)

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
app.include_router(documents_router, prefix="/api/v1", tags=["documents"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(declarations_router, prefix="/api/v1/declarations", tags=["declarations"])

# Add processing endpoints
from api.processing import router as processing_router
app.include_router(processing_router, prefix="/api/v1/processing", tags=["processing"])

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

"""
Credit Card Payment System - FastAPI Main Application
Module 3: Payment Processing Service
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from .core.config import settings
from .core.database import engine, Base
from .routes import payments, auth, users, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - create tables on startup"""
    try:
        Base.metadata.create_all(bind=engine)
        print("FastAPI database tables created/verified")
    except Exception as e:
        print(f"Database connection warning: {e}")
    yield
    print("FastAPI shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    docs_url="/docs",        # Swagger UI - Module 9 requirement
    redoc_url="/redoc",      # ReDoc documentation
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000", "http://127.0.0.1:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(payments.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint"""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "modules": {
            "payment_processing": "/api/payments",
            "auth_verification": "/api/auth",
            "user_lookup": "/api/users",
            "admin": "/api/admin",
        }
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check for Docker/deployment"""
    return {"status": "healthy", "service": "fastapi-payment-service"}

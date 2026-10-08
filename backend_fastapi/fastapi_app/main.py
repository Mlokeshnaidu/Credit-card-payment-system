"""
Credit Card Payment System - FastAPI Main Application
Module 3: Payment Processing Service
Module 9: API Documentation (Swagger /docs enabled)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .core.config import settings
from .core.database import engine, Base
from .models import User, Card, Transaction, PaymentLog  # Ensure all models are loaded
from .core.security import verify_jwt_token, security_bearer
from .routes import payments, auth, users, admin, cards, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - safely ensure tables exist on startup without dropping data"""
    try:
        Base.metadata.create_all(bind=engine)
        print("FastAPI database tables verified/created successfully")
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

# CORS Middleware - allows frontend and django requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(payments.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(cards.router, prefix="/api")

# Dashboard summary is accessible at both /dashboard/summary and /api/dashboard/summary
app.include_router(dashboard.router, prefix="/api")
app.include_router(dashboard.router)


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint"""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "modules": {
            "dashboard_summary": "/dashboard/summary",
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

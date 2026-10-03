import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Database
    DB_NAME: str = os.getenv("DB_NAME", "credit_card_db")
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "root")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "3306")

    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "fallback-secret-key")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRY_MINUTES: int = int(os.getenv("JWT_EXPIRY_MINUTES", 60))

    # App
    FASTAPI_HOST: str = os.getenv("FASTAPI_HOST", "0.0.0.0")
    FASTAPI_PORT: int = int(os.getenv("FASTAPI_PORT", 8001))
    DJANGO_BASE_URL: str = os.getenv("DJANGO_BASE_URL", "http://localhost:8000")

    # App info
    APP_NAME: str = "Credit Card Payment System - FastAPI"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "FastAPI Payment Processing Service for Credit Card Payment System"


settings = Settings()

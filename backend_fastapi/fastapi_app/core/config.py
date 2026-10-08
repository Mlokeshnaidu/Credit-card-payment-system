import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Database
    DB_NAME: str = os.getenv("DB_NAME", os.getenv("MYSQL_DATABASE", "credit_card_db"))
    DB_USER: str = os.getenv("DB_USER", os.getenv("MYSQL_USER", "root"))
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", os.getenv("MYSQL_PASSWORD", "root"))
    DB_HOST: str = os.getenv("DB_HOST", os.getenv("MYSQL_HOST", ""))
    DB_PORT: str = os.getenv("DB_PORT", os.getenv("MYSQL_PORT", "3306"))

    @property
    def DATABASE_URL(self) -> str:
        env_url = os.getenv("DATABASE_URL")
        if env_url:
            return env_url
        if self.DB_HOST:
            return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        return "sqlite:///dev.db"

    # JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", os.getenv("SECRET_KEY", "some-very-random-string"))
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRY_MINUTES: int = int(os.getenv("JWT_EXPIRY_MINUTES", 60))
    # Basic Auth credentials (hard‑coded fallback for demo)
    BASIC_USERNAME: str = os.getenv("BASIC_USERNAME", "Lokesh")
    BASIC_PASSWORD: str = os.getenv("BASIC_PASSWORD", "Loki@1234")

    # App
    FASTAPI_HOST: str = os.getenv("FASTAPI_HOST", "0.0.0.0")
    FASTAPI_PORT: int = int(os.getenv("FASTAPI_PORT", 8001))
    DJANGO_BASE_URL: str = os.getenv("DJANGO_BASE_URL", "http://localhost:8000")

    # App info
    APP_NAME: str = "Credit Card Payment System - FastAPI"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "FastAPI Payment Processing Service for Credit Card Payment System"


settings = Settings()

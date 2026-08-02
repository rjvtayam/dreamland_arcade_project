import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Dreamland Arcade"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://dreamland_app:dl_app_2026@localhost:5432/dreamland_arcade"
    )

    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dreamland-arcade-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Dreamland Arcade")

    IMAP_HOST: str = os.getenv("IMAP_HOST", "imap.gmail.com")
    IMAP_PORT: int = int(os.getenv("IMAP_PORT", "993"))
    IMAP_USER: str = os.getenv("IMAP_USER", "")
    IMAP_PASSWORD: str = os.getenv("IMAP_PASSWORD", "")
    IMAP_POLL_INTERVAL: int = int(os.getenv("IMAP_POLL_INTERVAL", "60"))

    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000")

    STATIC_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")

    class Config:
        env_file = ".env"


settings = Settings()

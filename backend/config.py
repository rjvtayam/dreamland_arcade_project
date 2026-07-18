import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Dreamland Arcade"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgre021600@localhost:5432/dreamland_arcade"
    )

    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dreamland-arcade-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    STATIC_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")

    class Config:
        env_file = ".env"


settings = Settings()

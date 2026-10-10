"""Application configuration loaded from environment (.env supported)."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Data Collection PWA Backend"
    environment: str = "development"
    debug: bool = False

    # Database — set DATABASE_URL to a postgresql+psycopg2:// URL for PostgreSQL.
    # SQLite is the local-development default so the stack runs without a DB server.
    database_url: str = "sqlite:///./backend.db"

    # Auth
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 480  # short-lived access credential
    login_rate_limit_attempts: int = 5
    login_rate_limit_window_seconds: int = 300

    # Storage (private object storage abstraction; local FS adapter by default)
    storage_root: str = "./storage"
    max_upload_bytes: int = 5 * 1024 * 1024  # 5 MB
    allowed_image_types: str = "image/jpeg,image/png,image/webp"

    # Photo capture policy (backend-configured slot count; frontend reads from here)
    photo_min: int = 6
    photo_max: int = 8

    # CORS — the PWA origin
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def allowed_origin_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def allowed_image_type_list(self) -> list[str]:
        return [t.strip() for t in self.allowed_image_types.split(",") if t.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

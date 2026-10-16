import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    FIREBASE_PROJECT_ID: str = "fabric-care-1f384"
    FIREBASE_STORAGE_BUCKET: str = "fabric-care-1f384.firebasestorage.app"
    GOOGLE_APPLICATION_CREDENTIALS: str | None = None
    USE_EMULATOR: bool = True
    FIRESTORE_EMULATOR_HOST: str = "localhost:8080"
    FIREBASE_AUTH_EMULATOR_HOST: str = "localhost:9099"
    FIREBASE_STORAGE_EMULATOR_HOST: str = "localhost:9199"
    
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5000,http://localhost:3000,http://127.0.0.1:8000"
    
    PAYMENT_GATEWAY: str = "mock"  # "mock" | "razorpay"
    PAYMENT_KEY_ID: str = "mock_key_id"
    PAYMENT_KEY_SECRET: str = "mock_key_secret"
    PAYMENT_WEBHOOK_SECRET: str = "mock_webhook_secret"
    
    EXPRESS_SURCHARGE_PERCENT: int = 0
    EXPRESS_HOURS: int = 24
    STANDARD_HOURS: int = 72
    AUTO_ASSIGN: bool = False
    
    INTERNAL_JOB_KEY: str = "fabricare-internal-super-secret-key-12345"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()

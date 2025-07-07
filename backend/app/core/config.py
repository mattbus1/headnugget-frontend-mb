from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    # Security
    JWT_SECRET: str = "changeme"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Database
    MONGODB_URL: str = "mongodb://localhost:27017/rhythmrisk"
    DATABASE_NAME: str = "rhythmrisk"
    
    # Storage
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "documents"
    MINIO_SECURE: bool = False
    
    # Background processing
    CELERY_BROKER_URL: str = "mongodb://localhost:27017/celery"
    
    # CORS
    CORS_ORIGINS: str = '["http://localhost:3000","http://localhost:3001"]'
    
    # Features
    ALLOW_REGISTRATION: bool = True
    
    # Development
    DEBUG: bool = True
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from JSON string to list"""
        try:
            return json.loads(self.CORS_ORIGINS)
        except json.JSONDecodeError:
            return ["http://localhost:3000", "http://localhost:3001"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
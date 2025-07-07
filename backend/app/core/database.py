from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from .config import settings
from ..models.user import User
from ..models.organization import Organization
from ..models.entity import Entity
from ..models.document import DocumentModel, ProcessedDocument


async def init_database():
    """Initialize database connection and models"""
    # Create motor client
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    
    # Initialize beanie with the models
    await init_beanie(
        database=client[settings.DATABASE_NAME],
        document_models=[
            User,
            Organization,
            Entity,
            DocumentModel,
            ProcessedDocument,
        ]
    )
    
    return client


async def close_database(client):
    """Close database connection"""
    client.close()
"""
Database connection with fallback to in-memory storage
"""
from .config import settings
from .memory_db import memory_db
import logging

logger = logging.getLogger(__name__)

# Global variables
use_memory_db = False
db_client = None


async def init_database():
    """Initialize database connection with fallback"""
    global use_memory_db, db_client
    
    try:
        # Try to initialize MongoDB
        from motor.motor_asyncio import AsyncIOMotorClient
        from beanie import init_beanie
        from ..models.user import User
        from ..models.organization import Organization
        from ..models.entity import Entity
        from ..models.document import DocumentModel, ProcessedDocument
        
        logger.info("Attempting MongoDB connection...")
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        
        # Test connection
        await client.admin.command('ping')
        
        # Initialize beanie
        await init_beanie(
            database=client[settings.DATABASE_NAME],
            document_models=[User, Organization, Entity, DocumentModel, ProcessedDocument]
        )
        
        db_client = client
        use_memory_db = False
        logger.info("✅ MongoDB connected successfully")
        
        # Create demo data
        from .init_data import create_demo_data
        await create_demo_data()
        
        return client
        
    except Exception as e:
        logger.warning(f"⚠️  MongoDB connection failed: {e}")
        logger.info("🧠 Falling back to in-memory database")
        use_memory_db = True
        logger.info("✅ In-memory database initialized with demo data")
        return None


async def close_database(client):
    """Close database connection"""
    if client:
        client.close()


def is_using_memory_db() -> bool:
    """Check if using in-memory database"""
    return use_memory_db


def get_memory_db():
    """Get in-memory database instance"""
    return memory_db
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
from beanie import Document
from pydantic import BaseModel


class EntityType(str, Enum):
    CLIENT = "client"
    SUBSIDIARY = "subsidiary"
    DIVISION = "division"
    PROPERTY = "property"
    POLICY_YEAR = "policy_year"
    PROJECT = "project"
    DEPARTMENT = "department"
    LOCATION = "location"
    CUSTOM = "custom"


class Entity(Document):
    name: str
    description: Optional[str] = None
    organization_id: str
    entity_type: EntityType
    metadata: Dict[str, Any] = {}
    is_active: bool = True
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()
    document_count: int = 0
    last_document_uploaded: Optional[datetime] = None
    
    class Settings:
        name = "entities"
        
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Main Office Building",
                "description": "Primary office location",
                "entity_type": "property",
                "metadata": {
                    "address": "123 Main St",
                    "square_feet": 50000
                }
            }
        }


# Request/Response models
class EntityCreate(BaseModel):
    name: str
    description: Optional[str] = None
    entity_type: EntityType
    metadata: Dict[str, Any] = {}


class EntityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    entity_type: Optional[EntityType] = None
    metadata: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class EntityResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    organization_id: str
    entity_type: EntityType
    metadata: Dict[str, Any] = {}
    is_active: bool
    created_at: datetime
    updated_at: datetime
    document_count: int
    last_document_uploaded: Optional[datetime] = None


class EntityStats(BaseModel):
    entity_id: str
    entity_name: str
    total_documents: int
    status_breakdown: Dict[str, int] = {
        "pending": 0,
        "processing": 0,
        "completed": 0,
        "failed": 0
    }
    document_types: Dict[str, int] = {}
    last_document_uploaded: Optional[datetime] = None
    created_at: datetime
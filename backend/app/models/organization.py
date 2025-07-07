from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import BaseModel


class Organization(Document):
    name: str
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()
    is_active: bool = True
    subscription_tier: str = "enterprise"
    max_documents_per_month: int = 1000
    documents_processed_this_month: int = 0
    billing_email: Optional[str] = None
    
    class Settings:
        name = "organizations"
        
    class Config:
        json_schema_extra = {
            "example": {
                "name": "ACME Corporation",
                "subscription_tier": "enterprise",
                "max_documents_per_month": 1000,
                "billing_email": "billing@acme.com"
            }
        }


# Request/Response models
class OrganizationCreate(BaseModel):
    name: str
    billing_email: Optional[str] = None


class OrganizationResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime
    is_active: bool
    subscription_tier: str
    max_documents_per_month: int
    documents_processed_this_month: int
    billing_email: Optional[str] = None
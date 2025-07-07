from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import BaseModel, EmailStr


class User(Document):
    email: EmailStr
    full_name: str
    hashed_password: str
    organization_id: str
    is_active: bool = True
    is_superuser: bool = False
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()
    
    class Settings:
        name = "users"
        
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "full_name": "John Doe",
                "organization_id": "org_123",
                "is_active": True,
                "is_superuser": False
            }
        }


# Request/Response models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organization_name: str


class UserLogin(BaseModel):
    username: EmailStr  # OAuth2 uses 'username' field
    password: str


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    organization_id: str
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime


class UserInDB(UserResponse):
    hashed_password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
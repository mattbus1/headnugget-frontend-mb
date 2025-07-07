from datetime import timedelta, datetime
from fastapi import APIRouter, HTTPException, status, Depends, Form
from fastapi.security import OAuth2PasswordRequestForm
from ..models.user import User, UserCreate, UserResponse, Token, UserLogin
from ..models.organization import Organization, OrganizationCreate
from ..models.entity import Entity, EntityType
from ..core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    get_current_user_id,
    settings
)
from ..core.database_fallback import is_using_memory_db, get_memory_db
from beanie import PydanticObjectId


router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """Register a new user and organization"""
    if not settings.ALLOW_REGISTRATION:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration is currently disabled"
        )
    
    if is_using_memory_db():
        db = get_memory_db()
        
        # Check if user already exists
        existing_user = await db.find_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists"
            )
        
        # Create organization first
        organization = await db.create_organization({
            "name": user_data.organization_name
        })
        
        # Create user
        hashed_password = get_password_hash(user_data.password)
        user = await db.create_user({
            "email": user_data.email,
            "full_name": user_data.full_name,
            "hashed_password": hashed_password,
            "organization_id": organization["id"],
            "is_active": True,
            "is_superuser": False
        })
        
        # Create default entity
        await db.create_entity({
            "name": "Default",
            "description": "Default entity for document organization",
            "organization_id": organization["id"],
            "entity_type": EntityType.CUSTOM,
            "metadata": {}
        })
        
        return UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            organization_id=user["organization_id"],
            is_active=user["is_active"],
            is_superuser=user["is_superuser"],
            created_at=user["created_at"],
            updated_at=user["updated_at"]
        )
    
    else:
        # MongoDB implementation
        existing_user = await User.find_one(User.email == user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists"
            )
        
        organization = Organization(name=user_data.organization_name)
        await organization.insert()
        
        hashed_password = get_password_hash(user_data.password)
        user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            organization_id=str(organization.id)
        )
        await user.insert()
        
        default_entity = Entity(
            name="Default",
            description="Default entity for document organization",
            organization_id=str(organization.id),
            entity_type=EntityType.CUSTOM
        )
        await default_entity.insert()
        
        return UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            organization_id=user.organization_id,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            created_at=user.created_at,
            updated_at=user.updated_at
        )


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login with email and password"""
    
    if is_using_memory_db():
        db = get_memory_db()
        
        # Find user by email
        user = await db.find_user_by_email(form_data.username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify password
        if not verify_password(form_data.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is active
        if not user["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["id"]}, expires_delta=access_token_expires
        )
        
        return Token(access_token=access_token, token_type="bearer")
    
    else:
        # MongoDB implementation
        user = await User.find_one(User.email == form_data.username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user_id: str = Depends(get_current_user_id)):
    """Get current user information"""
    
    if is_using_memory_db():
        db = get_memory_db()
        user = await db.get_user_by_id(current_user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            organization_id=user["organization_id"],
            is_active=user["is_active"],
            is_superuser=user["is_superuser"],
            created_at=user["created_at"],
            updated_at=user["updated_at"]
        )
    
    else:
        # MongoDB implementation
        user = await User.get(PydanticObjectId(current_user_id))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            organization_id=user.organization_id,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
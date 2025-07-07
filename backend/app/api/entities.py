from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from beanie import PydanticObjectId
from ..models.user import User
from ..models.entity import Entity, EntityCreate, EntityUpdate, EntityResponse, EntityStats, EntityType
from ..core.security import get_current_user_id


router = APIRouter(prefix="/api/entities", tags=["entities"])


async def get_current_user(current_user_id: str = Depends(get_current_user_id)) -> User:
    """Get current user from token"""
    user = await User.get(PydanticObjectId(current_user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.post("/", response_model=EntityResponse)
async def create_entity(
    entity_data: EntityCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new entity"""
    # Check if entity name already exists in this organization
    existing_entity = await Entity.find_one(
        Entity.name == entity_data.name,
        Entity.organization_id == current_user.organization_id,
        Entity.is_active == True
    )
    if existing_entity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An entity with this name already exists in your organization"
        )
    
    # Create entity
    entity = Entity(
        name=entity_data.name,
        description=entity_data.description,
        organization_id=current_user.organization_id,
        entity_type=entity_data.entity_type,
        metadata=entity_data.metadata
    )
    await entity.insert()
    
    return EntityResponse(
        id=str(entity.id),
        name=entity.name,
        description=entity.description,
        organization_id=entity.organization_id,
        entity_type=entity.entity_type,
        metadata=entity.metadata,
        is_active=entity.is_active,
        created_at=entity.created_at,
        updated_at=entity.updated_at,
        document_count=entity.document_count,
        last_document_uploaded=entity.last_document_uploaded
    )


@router.get("/", response_model=List[EntityResponse])
async def list_entities(
    entity_type: Optional[EntityType] = Query(None, description="Filter by entity type"),
    include_inactive: bool = Query(False, description="Include inactive entities"),
    current_user: User = Depends(get_current_user)
):
    """List entities for the user's organization"""
    query_filters = [Entity.organization_id == current_user.organization_id]
    
    if not include_inactive:
        query_filters.append(Entity.is_active == True)
    
    if entity_type:
        query_filters.append(Entity.entity_type == entity_type)
    
    entities = await Entity.find(*query_filters).sort(+Entity.name).to_list()
    
    return [
        EntityResponse(
            id=str(entity.id),
            name=entity.name,
            description=entity.description,
            organization_id=entity.organization_id,
            entity_type=entity.entity_type,
            metadata=entity.metadata,
            is_active=entity.is_active,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            document_count=entity.document_count,
            last_document_uploaded=entity.last_document_uploaded
        )
        for entity in entities
    ]


@router.get("/{entity_id}", response_model=EntityResponse)
async def get_entity(
    entity_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific entity"""
    entity = await Entity.get(PydanticObjectId(entity_id))
    if not entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entity not found"
        )
    
    # Check if entity belongs to user's organization
    if entity.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this entity"
        )
    
    return EntityResponse(
        id=str(entity.id),
        name=entity.name,
        description=entity.description,
        organization_id=entity.organization_id,
        entity_type=entity.entity_type,
        metadata=entity.metadata,
        is_active=entity.is_active,
        created_at=entity.created_at,
        updated_at=entity.updated_at,
        document_count=entity.document_count,
        last_document_uploaded=entity.last_document_uploaded
    )


@router.put("/{entity_id}", response_model=EntityResponse)
async def update_entity(
    entity_id: str,
    entity_data: EntityUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an entity"""
    entity = await Entity.get(PydanticObjectId(entity_id))
    if not entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entity not found"
        )
    
    # Check if entity belongs to user's organization
    if entity.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this entity"
        )
    
    # Update fields
    update_data = entity_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entity, field, value)
    
    entity.updated_at = entity.updated_at.__class__.utcnow()
    await entity.save()
    
    return EntityResponse(
        id=str(entity.id),
        name=entity.name,
        description=entity.description,
        organization_id=entity.organization_id,
        entity_type=entity.entity_type,
        metadata=entity.metadata,
        is_active=entity.is_active,
        created_at=entity.created_at,
        updated_at=entity.updated_at,
        document_count=entity.document_count,
        last_document_uploaded=entity.last_document_uploaded
    )


@router.delete("/{entity_id}")
async def delete_entity(
    entity_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an entity (soft delete if has documents, hard delete if empty)"""
    entity = await Entity.get(PydanticObjectId(entity_id))
    if not entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entity not found"
        )
    
    # Check if entity belongs to user's organization
    if entity.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this entity"
        )
    
    # Check if this is the default entity
    if entity.name == "Default":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the default entity"
        )
    
    # If entity has documents, soft delete
    if entity.document_count > 0:
        entity.is_active = False
        entity.updated_at = entity.updated_at.__class__.utcnow()
        await entity.save()
        return {"message": "Entity deactivated (has associated documents)"}
    else:
        # Hard delete if no documents
        await entity.delete()
        return {"message": "Entity deleted"}


@router.get("/{entity_id}/stats", response_model=EntityStats)
async def get_entity_stats(
    entity_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed statistics for an entity"""
    entity = await Entity.get(PydanticObjectId(entity_id))
    if not entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entity not found"
        )
    
    # Check if entity belongs to user's organization
    if entity.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this entity"
        )
    
    # TODO: Calculate actual statistics from documents
    # For now, return basic stats
    return EntityStats(
        entity_id=str(entity.id),
        entity_name=entity.name,
        total_documents=entity.document_count,
        status_breakdown={
            "pending": 0,
            "processing": 0,
            "completed": entity.document_count,
            "failed": 0
        },
        document_types={},
        last_document_uploaded=entity.last_document_uploaded,
        created_at=entity.created_at
    )
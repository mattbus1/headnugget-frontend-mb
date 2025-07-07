from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any
from ..models.user import User
from ..models.entity import Entity
from ..core.security import get_current_user_id
from beanie import PydanticObjectId
from pydantic import BaseModel


router = APIRouter(prefix="/api/analytics", tags=["analytics"])


class CoverageLayer(BaseModel):
    layer_number: int
    coverage_type: str
    limit: float
    deductible: float
    premium: float
    carrier: str
    policy_number: str
    effective_date: str
    expiration_date: str


class EntityPremiumSummary(BaseModel):
    id: str
    entity_id: str
    organization_id: str
    policy_year: int
    total_premium: float
    total_limit: float
    coverage_layers: List[CoverageLayer]


class OrganizationPremiumOverview(BaseModel):
    total_premium: float
    total_entities: int
    top_entities: List[Dict[str, Any]]
    coverage_distribution: Dict[str, float]


async def get_current_user(current_user_id: str = Depends(get_current_user_id)) -> User:
    """Get current user from token"""
    user = await User.get(PydanticObjectId(current_user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.get("/premium-summary/{entity_id}", response_model=EntityPremiumSummary)
async def get_premium_summary(
    entity_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get premium summary for entity"""
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
    
    # TODO: Calculate actual premium data from processed documents
    # For now, return mock data
    mock_layers = [
        CoverageLayer(
            layer_number=1,
            coverage_type="General Liability",
            limit=1000000.0,
            deductible=10000.0,
            premium=25000.0,
            carrier="ABC Insurance",
            policy_number="GL-2024-001",
            effective_date="2024-01-01",
            expiration_date="2024-12-31"
        ),
        CoverageLayer(
            layer_number=2,
            coverage_type="Property",
            limit=5000000.0,
            deductible=25000.0,
            premium=45000.0,
            carrier="XYZ Insurance",
            policy_number="PROP-2024-001",
            effective_date="2024-01-01",
            expiration_date="2024-12-31"
        )
    ]
    
    total_premium = sum(layer.premium for layer in mock_layers)
    total_limit = sum(layer.limit for layer in mock_layers)
    
    return EntityPremiumSummary(
        id=f"summary_{entity_id}",
        entity_id=entity_id,
        organization_id=current_user.organization_id,
        policy_year=2024,
        total_premium=total_premium,
        total_limit=total_limit,
        coverage_layers=mock_layers
    )


@router.get("/premium-towers/{entity_id}")
async def get_premium_towers(
    entity_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get coverage towers for entity"""
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
    
    # TODO: Generate actual coverage tower data
    # For now, return mock visualization data
    return {
        "entity_id": entity_id,
        "entity_name": entity.name,
        "towers": [
            {
                "coverage_type": "General Liability",
                "layers": [
                    {"limit": 1000000, "premium": 25000, "carrier": "ABC Insurance"},
                    {"limit": 4000000, "premium": 35000, "carrier": "DEF Insurance"}
                ]
            },
            {
                "coverage_type": "Property",
                "layers": [
                    {"limit": 5000000, "premium": 45000, "carrier": "XYZ Insurance"}
                ]
            }
        ]
    }


@router.get("/visualization-data/{entity_id}")
async def get_visualization_data(
    entity_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get structured data for coverage tower visualization"""
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
    
    # TODO: Generate actual visualization data from processed documents
    # Return mock chart data for frontend
    return {
        "entity_id": entity_id,
        "chart_data": {
            "labels": ["General Liability", "Property", "Auto", "Umbrella"],
            "datasets": [
                {
                    "label": "Premium ($)",
                    "data": [25000, 45000, 15000, 12000],
                    "backgroundColor": ["#8B7355", "#A0845C", "#B89563", "#D0A66A"]
                },
                {
                    "label": "Limit ($)",
                    "data": [1000000, 5000000, 1000000, 10000000],
                    "backgroundColor": ["#6B5B47", "#7A6A54", "#897961", "#98886E"]
                }
            ]
        }
    }


@router.get("/organization-premium-overview", response_model=OrganizationPremiumOverview)
async def get_organization_premium_overview(current_user: User = Depends(get_current_user)):
    """Get premium overview for entire organization"""
    
    # Get all entities for the organization
    entities = await Entity.find(
        Entity.organization_id == current_user.organization_id,
        Entity.is_active == True
    ).to_list()
    
    # TODO: Calculate actual premium data from all entities
    # For now, return mock data
    total_premium = len(entities) * 50000.0  # Mock calculation
    
    top_entities = []
    for i, entity in enumerate(entities[:5]):  # Top 5 entities
        mock_premium = (5 - i) * 20000.0
        top_entities.append({
            "entity_id": str(entity.id),
            "entity_name": entity.name,
            "entity_type": entity.entity_type,
            "premium": mock_premium,
            "document_count": entity.document_count
        })
    
    coverage_distribution = {
        "General Liability": 35.0,
        "Property": 30.0,
        "Auto": 20.0,
        "Umbrella": 15.0
    }
    
    return OrganizationPremiumOverview(
        total_premium=total_premium,
        total_entities=len(entities),
        top_entities=top_entities,
        coverage_distribution=coverage_distribution
    )


@router.post("/refresh-cache/{entity_id}")
async def refresh_cache(
    entity_id: str,
    current_user: User = Depends(get_current_user)
):
    """Refresh cached premium data for entity"""
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
    
    # TODO: Implement actual cache refresh logic
    # For now, just return success message
    return {
        "message": f"Cache refreshed for entity {entity.name}",
        "entity_id": entity_id,
        "refreshed_at": "2024-01-01T00:00:00Z"
    }
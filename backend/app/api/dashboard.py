from fastapi import APIRouter, Depends
from typing import List
from ..models.user import User
from ..models.document import DocumentModel, DocumentStatus
from ..models.entity import Entity
from ..core.security import get_current_user_id
from beanie import PydanticObjectId
from pydantic import BaseModel
from datetime import datetime, timedelta


router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


class ProcessingSummary(BaseModel):
    avg_processing_time: float
    success_rate: float
    documents_this_week: int
    documents_this_month: int


class DashboardStats(BaseModel):
    total_documents: int
    processing_documents: int
    completed_documents: int
    failed_documents: int
    total_entities: int
    recent_documents: List[dict]
    processing_summary: ProcessingSummary


async def get_current_user(current_user_id: str = Depends(get_current_user_id)) -> User:
    """Get current user from token"""
    user = await User.get(PydanticObjectId(current_user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    """Get organization dashboard statistics"""
    
    # Get document counts by status
    total_docs = await DocumentModel.find(
        DocumentModel.organization_id == current_user.organization_id
    ).count()
    
    processing_docs = await DocumentModel.find(
        DocumentModel.organization_id == current_user.organization_id,
        DocumentModel.status == DocumentStatus.PROCESSING
    ).count()
    
    completed_docs = await DocumentModel.find(
        DocumentModel.organization_id == current_user.organization_id,
        DocumentModel.status == DocumentStatus.COMPLETED
    ).count()
    
    failed_docs = await DocumentModel.find(
        DocumentModel.organization_id == current_user.organization_id,
        DocumentModel.status == DocumentStatus.FAILED
    ).count()
    
    # Get entity count
    total_entities = await Entity.find(
        Entity.organization_id == current_user.organization_id,
        Entity.is_active == True
    ).count()
    
    # Get recent documents (last 10)
    recent_docs = await DocumentModel.find(
        DocumentModel.organization_id == current_user.organization_id
    ).sort(-DocumentModel.created_at).limit(10).to_list()
    
    recent_documents = []
    for doc in recent_docs:
        recent_documents.append({
            "id": str(doc.id),
            "filename": doc.filename,
            "status": doc.status,
            "created_at": doc.created_at.isoformat(),
            "file_size": doc.file_size
        })
    
    # Calculate processing summary
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    docs_this_week = await DocumentModel.find(
        DocumentModel.organization_id == current_user.organization_id,
        DocumentModel.created_at >= week_ago
    ).count()
    
    docs_this_month = await DocumentModel.find(
        DocumentModel.organization_id == current_user.organization_id,
        DocumentModel.created_at >= month_ago
    ).count()
    
    # Calculate success rate
    success_rate = 0.0
    if total_docs > 0:
        success_rate = (completed_docs / total_docs) * 100
    
    # Calculate average processing time (mock for now)
    avg_processing_time = 15.5  # seconds
    
    processing_summary = ProcessingSummary(
        avg_processing_time=avg_processing_time,
        success_rate=success_rate,
        documents_this_week=docs_this_week,
        documents_this_month=docs_this_month
    )
    
    return DashboardStats(
        total_documents=total_docs,
        processing_documents=processing_docs,
        completed_documents=completed_docs,
        failed_documents=failed_docs,
        total_entities=total_entities,
        recent_documents=recent_documents,
        processing_summary=processing_summary
    )
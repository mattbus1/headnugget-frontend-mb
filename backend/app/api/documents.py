from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File, Form
from beanie import PydanticObjectId
from ..models.user import User
from ..models.entity import Entity
from ..models.document import (
    DocumentModel, 
    DocumentStatus, 
    DocumentUploadResponse, 
    DocumentResponse,
    DocumentDataResponse,
    DocumentStatusResponse,
    ProcessingStage,
    ProcessingStageRecord
)
from ..core.security import get_current_user_id
from ..core.database_fallback import is_using_memory_db, get_memory_db
import uuid
import os


router = APIRouter(prefix="/api/documents", tags=["documents"])

# Allowed file types and max size
ALLOWED_FILE_TYPES = {
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/tiff": ".tiff"
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


async def get_current_user(current_user_id: str = Depends(get_current_user_id)):
    """Get current user from token"""
    if is_using_memory_db():
        db = get_memory_db()
        user = await db.get_user_by_id(current_user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    else:
        user = await User.get(PydanticObjectId(current_user_id))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    entity_id: Optional[str] = Form(None),
    current_user = Depends(get_current_user)
):
    """Upload a document for processing"""
    
    # Validate file type
    if file.content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file.content_type} not allowed. Allowed types: {', '.join(ALLOWED_FILE_TYPES.keys())}"
        )
    
    # Read file content to check size
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size {len(file_content)} bytes exceeds maximum allowed size of {MAX_FILE_SIZE} bytes"
        )
    
    if is_using_memory_db():
        db = get_memory_db()
        
        # Get organization ID from user
        if isinstance(current_user, dict):
            org_id = current_user["organization_id"]
            user_id = current_user["id"]
        else:
            org_id = current_user.organization_id
            user_id = str(current_user.id)
        
        # Validate entity if provided
        entity = None
        if entity_id:
            entity = await db.get_entity_by_id(entity_id)
            if not entity or entity["organization_id"] != org_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid entity ID or entity does not belong to your organization"
                )
        
        # Generate unique file ID and storage path
        file_id = str(uuid.uuid4())
        storage_path = f"{org_id}/{file_id}/{file.filename}"
        
        # Create document record in memory DB
        document_data = {
            "filename": file.filename,
            "organization_id": org_id,
            "entity_id": entity_id,
            "uploaded_by": user_id,
            "storage_path": storage_path,
            "file_size": len(file_content),
            "file_type": file.content_type,
            "status": "completed",  # Simulate immediate completion
            "processing_started_at": datetime.utcnow(),
            "processing_completed_at": datetime.utcnow(),
            "stage_history": [
                {
                    "stage": "text_extraction",
                    "started_at": datetime.utcnow(),
                    "completed_at": datetime.utcnow(),
                    "status": "completed",
                    "duration_seconds": 1.0
                },
                {
                    "stage": "classification",
                    "started_at": datetime.utcnow(),
                    "completed_at": datetime.utcnow(),
                    "status": "completed",
                    "duration_seconds": 0.5
                }
            ],
            "extracted_text": file_content.decode('utf-8') if file.content_type == 'text/plain' else None
        }
        
        document = await db.create_document(document_data)
        
        # Update entity document count if entity specified
        if entity:
            await db.update_entity(entity_id, {
                "document_count": entity["document_count"] + 1,
                "last_document_uploaded": datetime.utcnow()
            })
        
        return DocumentUploadResponse(
            id=document["id"],
            filename=document["filename"],
            file_type=document["file_type"],
            status=document["status"],
            created_at=document["created_at"],
            file_size=document["file_size"],
            organization_id=document["organization_id"],
            entity_id=document.get("entity_id"),
            entity_name=entity["name"] if entity else None,
            entity_type=entity["entity_type"] if entity else None
        )
    
    else:
        # MongoDB implementation
        # Validate entity if provided
        entity = None
        if entity_id:
            entity = await Entity.get(PydanticObjectId(entity_id))
            if not entity or entity.organization_id != current_user.organization_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid entity ID or entity does not belong to your organization"
                )
        
        # Generate unique file ID and storage path
        file_id = str(uuid.uuid4())
        storage_path = f"{current_user.organization_id}/{file_id}/{file.filename}"
        
        # Create document record
        document = DocumentModel(
            filename=file.filename,
            organization_id=current_user.organization_id,
            entity_id=entity_id,
            uploaded_by=str(current_user.id),
            storage_path=storage_path,
            file_size=len(file_content),
            file_type=file.content_type,
            status=DocumentStatus.PENDING
        )
        await document.insert()
        
        # Update entity document count if entity specified
        if entity:
            entity.document_count += 1
            entity.last_document_uploaded = datetime.utcnow()
            await entity.save()
        
        # Simulate immediate processing completion
        document.status = DocumentStatus.COMPLETED
        document.processing_started_at = datetime.utcnow()
        document.processing_completed_at = datetime.utcnow()
        document.stage_history = [
            ProcessingStageRecord(
                stage=ProcessingStage.TEXT_EXTRACTION,
                started_at=datetime.utcnow(),
                completed_at=datetime.utcnow(),
                status="completed",
                duration_seconds=1.0
            ),
            ProcessingStageRecord(
                stage=ProcessingStage.CLASSIFICATION,
                started_at=datetime.utcnow(),
                completed_at=datetime.utcnow(),
                status="completed",
                duration_seconds=0.5
            )
        ]
        await document.save()
        
        return DocumentUploadResponse(
            id=str(document.id),
            filename=document.filename,
            file_type=document.file_type,
            status=document.status,
            created_at=document.created_at,
            file_size=document.file_size,
            organization_id=document.organization_id,
            entity_id=document.entity_id,
            entity_name=entity.name if entity else None,
            entity_type=entity.entity_type if entity else None
        )


@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[DocumentStatus] = Query(None, description="Filter by status"),
    entity_id: Optional[str] = Query(None, description="Filter by entity"),
    current_user = Depends(get_current_user)
):
    """List documents with pagination and filtering"""
    
    if is_using_memory_db():
        db = get_memory_db()
        
        # Get organization ID from user
        if isinstance(current_user, dict):
            org_id = current_user["organization_id"]
        else:
            org_id = current_user.organization_id
        
        # Calculate skip for pagination
        skip = (page - 1) * limit
        
        # Get documents from memory DB
        documents = await db.get_documents_by_org(
            org_id=org_id,
            status=status,
            entity_id=entity_id,
            skip=skip,
            limit=limit
        )
        
        # Build response
        response_docs = []
        for doc in documents:
            entity_name = None
            entity_type = None
            if doc.get("entity_id"):
                entity = await db.get_entity_by_id(doc["entity_id"])
                if entity:
                    entity_name = entity["name"]
                    entity_type = entity["entity_type"]
            
            response_docs.append(DocumentResponse(
                id=doc["id"],
                filename=doc["filename"],
                file_type=doc["file_type"],
                status=doc["status"],
                created_at=doc["created_at"],
                file_size=doc["file_size"],
                organization_id=doc["organization_id"],
                entity_id=doc.get("entity_id"),
                entity_name=entity_name,
                entity_type=entity_type,
                error_message=doc.get("error_message"),
                processing_started_at=doc.get("processing_started_at"),
                processing_completed_at=doc.get("processing_completed_at"),
                current_stage=doc.get("current_stage"),
                stage_history=doc.get("stage_history", []),
                processing_duration_seconds=doc.get("processing_duration_seconds")
            ))
        
        return response_docs
    
    else:
        # MongoDB implementation
        # Build query filters
        query_filters = [DocumentModel.organization_id == current_user.organization_id]
        
        if status:
            query_filters.append(DocumentModel.status == status)
        
        if entity_id:
            query_filters.append(DocumentModel.entity_id == entity_id)
        
        # Calculate skip for pagination
        skip = (page - 1) * limit
        
        # Get documents
        documents = await DocumentModel.find(*query_filters).sort(-DocumentModel.created_at).skip(skip).limit(limit).to_list()
        
        # Get entity names for documents
        entity_map = {}
        entity_ids = [doc.entity_id for doc in documents if doc.entity_id]
        if entity_ids:
            entities = await Entity.find(Entity.id.in_([PydanticObjectId(eid) for eid in entity_ids])).to_list()
            entity_map = {str(entity.id): entity for entity in entities}
        
        # Build response
        response_docs = []
        for doc in documents:
            entity = entity_map.get(doc.entity_id) if doc.entity_id else None
            
            # Calculate processing duration
            processing_duration = None
            if doc.processing_started_at and doc.processing_completed_at:
                processing_duration = (doc.processing_completed_at - doc.processing_started_at).total_seconds()
            
            response_docs.append(DocumentResponse(
                id=str(doc.id),
                filename=doc.filename,
                file_type=doc.file_type,
                status=doc.status,
                created_at=doc.created_at,
                file_size=doc.file_size,
                organization_id=doc.organization_id,
                entity_id=doc.entity_id,
                entity_name=entity.name if entity else None,
                entity_type=entity.entity_type if entity else None,
                error_message=doc.error_message,
                processing_started_at=doc.processing_started_at,
                processing_completed_at=doc.processing_completed_at,
                current_stage=doc.current_stage,
                stage_history=doc.stage_history,
                processing_duration_seconds=processing_duration
            ))
        
        return response_docs


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user = Depends(get_current_user)
):
    """Get a specific document"""
    
    if is_using_memory_db():
        db = get_memory_db()
        
        # Get organization ID from user
        if isinstance(current_user, dict):
            org_id = current_user["organization_id"]
        else:
            org_id = current_user.organization_id
        
        # Get document from memory DB
        document = await db.get_document_by_id(document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Check if document belongs to user's organization
        if document["organization_id"] != org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this document"
            )
        
        # Get entity information if available
        entity_name = None
        entity_type = None
        if document.get("entity_id"):
            entity = await db.get_entity_by_id(document["entity_id"])
            if entity:
                entity_name = entity["name"]
                entity_type = entity["entity_type"]
        
        # Calculate processing duration
        processing_duration = None
        if document.get("processing_started_at") and document.get("processing_completed_at"):
            start = document["processing_started_at"]
            end = document["processing_completed_at"]
            if isinstance(start, str):
                start = datetime.fromisoformat(start.replace('Z', '+00:00'))
                end = datetime.fromisoformat(end.replace('Z', '+00:00'))
            processing_duration = (end - start).total_seconds()
        
        return DocumentResponse(
            id=document["id"],
            filename=document["filename"],
            file_type=document["file_type"],
            status=document["status"],
            created_at=document["created_at"],
            file_size=document["file_size"],
            organization_id=document["organization_id"],
            entity_id=document.get("entity_id"),
            entity_name=entity_name,
            entity_type=entity_type,
            error_message=document.get("error_message"),
            processing_started_at=document.get("processing_started_at"),
            processing_completed_at=document.get("processing_completed_at"),
            current_stage=document.get("current_stage"),
            stage_history=document.get("stage_history", []),
            processing_duration_seconds=processing_duration
        )
    
    else:
        # MongoDB implementation
        document = await DocumentModel.get(PydanticObjectId(document_id))
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Check if document belongs to user's organization
        if document.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this document"
            )
        
        # Get entity information if available
        entity = None
        if document.entity_id:
            entity = await Entity.get(PydanticObjectId(document.entity_id))
        
        # Calculate processing duration
        processing_duration = None
        if document.processing_started_at and document.processing_completed_at:
            processing_duration = (document.processing_completed_at - document.processing_started_at).total_seconds()
        
        return DocumentResponse(
            id=str(document.id),
            filename=document.filename,
            file_type=document.file_type,
            status=document.status,
            created_at=document.created_at,
            file_size=document.file_size,
            organization_id=document.organization_id,
            entity_id=document.entity_id,
            entity_name=entity.name if entity else None,
            entity_type=entity.entity_type if entity else None,
            error_message=document.error_message,
            processing_started_at=document.processing_started_at,
            processing_completed_at=document.processing_completed_at,
            current_stage=document.current_stage,
            stage_history=document.stage_history,
            processing_duration_seconds=processing_duration
        )


@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(
    document_id: str,
    current_user = Depends(get_current_user)
):
    """Get detailed processing status for a document"""
    
    if is_using_memory_db():
        db = get_memory_db()
        
        # Get organization ID from user
        if isinstance(current_user, dict):
            org_id = current_user["organization_id"]
        else:
            org_id = current_user.organization_id
        
        # Get document from memory DB
        document = await db.get_document_by_id(document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Check if document belongs to user's organization
        if document["organization_id"] != org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this document"
            )
        
        # Calculate processing duration
        processing_duration = None
        if document.get("processing_started_at") and document.get("processing_completed_at"):
            start = document["processing_started_at"]
            end = document["processing_completed_at"]
            if isinstance(start, str):
                from datetime import datetime
                start = datetime.fromisoformat(start.replace('Z', '+00:00'))
                end = datetime.fromisoformat(end.replace('Z', '+00:00'))
            processing_duration = (end - start).total_seconds()
        elif document.get("processing_started_at"):
            start = document["processing_started_at"]
            if isinstance(start, str):
                start = datetime.fromisoformat(start.replace('Z', '+00:00'))
            processing_duration = (datetime.utcnow() - start).total_seconds()
        
        # Check if stuck (processing for more than 5 minutes)
        is_stuck = False
        stuck_stage = None
        if document["status"] == "processing" and processing_duration and processing_duration > 300:
            is_stuck = True
            stuck_stage = document.get("current_stage")
        
        return DocumentStatusResponse(
            document_id=document["id"],
            filename=document["filename"],
            status=document["status"],
            current_stage=document.get("current_stage"),
            stage_history=document.get("stage_history", []),
            processing_duration_seconds=processing_duration,
            is_stuck=is_stuck,
            stuck_stage=stuck_stage,
            error_message=document.get("error_message"),
            processing_started_at=document.get("processing_started_at"),
            processing_completed_at=document.get("processing_completed_at")
        )
    
    else:
        # MongoDB implementation
        document = await DocumentModel.get(PydanticObjectId(document_id))
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Check if document belongs to user's organization
        if document.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this document"
            )
        
        # Calculate processing duration
        processing_duration = None
        if document.processing_started_at and document.processing_completed_at:
            processing_duration = (document.processing_completed_at - document.processing_started_at).total_seconds()
        elif document.processing_started_at:
            processing_duration = (datetime.utcnow() - document.processing_started_at).total_seconds()
        
        # Check if stuck (processing for more than 5 minutes)
        is_stuck = False
        stuck_stage = None
        if document.status == DocumentStatus.PROCESSING and processing_duration and processing_duration > 300:
            is_stuck = True
            stuck_stage = document.current_stage
        
        return DocumentStatusResponse(
            document_id=str(document.id),
            filename=document.filename,
            status=document.status,
            current_stage=document.current_stage,
            stage_history=document.stage_history,
            processing_duration_seconds=processing_duration,
            is_stuck=is_stuck,
            stuck_stage=stuck_stage,
            error_message=document.error_message,
            processing_started_at=document.processing_started_at,
            processing_completed_at=document.processing_completed_at
        )


@router.get("/{document_id}/data", response_model=DocumentDataResponse)
async def get_document_data(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get extracted data and analysis from processed document"""
    document = await DocumentModel.get(PydanticObjectId(document_id))
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check if document belongs to user's organization
    if document.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this document"
        )
    
    # TODO: Get processed document data
    # For now, return mock data
    return DocumentDataResponse(
        extracted_text=document.extracted_text,
        processing_metadata={
            "processed_at": datetime.utcnow().isoformat(),
            "processing_method": "mock",
            "file_type": document.file_type,
            "file_size": document.file_size
        }
    )


@router.post("/{document_id}/reprocess")
async def reprocess_document(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """Reprocess a failed or stuck document"""
    document = await DocumentModel.get(PydanticObjectId(document_id))
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check if document belongs to user's organization
    if document.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this document"
        )
    
    # Check if reprocessing is allowed
    if document.status not in [DocumentStatus.FAILED]:
        # Allow reprocessing if stuck (processing for more than 5 minutes)
        if document.status == DocumentStatus.PROCESSING and document.processing_started_at:
            processing_duration = (datetime.utcnow() - document.processing_started_at).total_seconds()
            if processing_duration <= 300:  # 5 minutes
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Document is still processing. Please wait or try again later."
                )
        elif document.status == DocumentStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document has already been processed successfully"
            )
    
    # Reset document for reprocessing
    document.status = DocumentStatus.PENDING
    document.error_message = None
    document.processing_started_at = None
    document.processing_completed_at = None
    document.current_stage = None
    document.stage_history = []
    await document.save()
    
    # TODO: Queue document for processing with Celery
    
    return {"message": "Document queued for reprocessing"}


@router.patch("/{document_id}/entity")
async def update_document_entity(
    document_id: str,
    entity_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Update entity assignment for a document"""
    document = await DocumentModel.get(PydanticObjectId(document_id))
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check if document belongs to user's organization
    if document.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this document"
        )
    
    # Validate new entity if provided
    if entity_id:
        entity = await Entity.get(PydanticObjectId(entity_id))
        if not entity or entity.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid entity ID or entity does not belong to your organization"
            )
    
    # Update old entity count if document was previously assigned
    if document.entity_id:
        old_entity = await Entity.get(PydanticObjectId(document.entity_id))
        if old_entity:
            old_entity.document_count = max(0, old_entity.document_count - 1)
            await old_entity.save()
    
    # Update new entity count if new entity assigned
    if entity_id:
        new_entity = await Entity.get(PydanticObjectId(entity_id))
        if new_entity:
            new_entity.document_count += 1
            new_entity.last_document_uploaded = datetime.utcnow()
            await new_entity.save()
    
    # Update document
    document.entity_id = entity_id
    await document.save()
    
    return {"message": "Document entity assignment updated successfully"}
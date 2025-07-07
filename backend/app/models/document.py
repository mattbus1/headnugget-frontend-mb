from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from beanie import Document
from pydantic import BaseModel


class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ProcessingStage(str, Enum):
    TEXT_EXTRACTION = "text_extraction"
    CLASSIFICATION = "classification"
    FIELD_EXTRACTION = "field_extraction"
    VALIDATION = "validation"


class DocumentType(str, Enum):
    # ACORD Forms
    ACORD_125 = "acord_125"
    ACORD_140 = "acord_140"
    ACORD_131 = "acord_131"
    ACORD_137 = "acord_137"
    ACORD_301 = "acord_301"
    ACORD_89 = "acord_89"
    ACORD_OTHER = "acord_other"
    
    # Insurance Policies
    INSURANCE_POLICY_AUTO = "insurance_policy_auto"
    INSURANCE_POLICY_PROPERTY = "insurance_policy_property"
    INSURANCE_POLICY_LIABILITY = "insurance_policy_liability"
    INSURANCE_POLICY_UMBRELLA = "insurance_policy_umbrella"
    INSURANCE_POLICY_WORKERS_COMP = "insurance_policy_workers_comp"
    INSURANCE_POLICY_CYBER = "insurance_policy_cyber"
    INSURANCE_POLICY_OTHER = "insurance_policy_other"
    
    # Supporting Documents
    INSURANCE_DECLARATION = "insurance_declaration"
    INSURANCE_CERTIFICATE = "insurance_certificate"
    INSURANCE_QUOTE = "insurance_quote"
    INSURANCE_BINDER = "insurance_binder"
    INSURANCE_ENDORSEMENT = "insurance_endorsement"
    
    # Other
    SOV = "sov"  # Schedule of Values
    LOSS_RUN = "loss_run"
    UNKNOWN = "unknown"


class ProcessingStageRecord(BaseModel):
    stage: ProcessingStage
    started_at: datetime
    completed_at: Optional[datetime] = None
    status: str  # started, completed, failed
    error_message: Optional[str] = None
    duration_seconds: Optional[float] = None


class DocumentModel(Document):
    filename: str
    organization_id: str
    entity_id: Optional[str] = None
    uploaded_by: str  # user_id
    storage_path: str
    file_size: int
    file_type: str
    status: DocumentStatus = DocumentStatus.PENDING
    error_message: Optional[str] = None
    created_at: datetime = datetime.utcnow()
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None
    extraction_completed_at: Optional[datetime] = None
    extracted_text: Optional[str] = None
    stage_history: List[ProcessingStageRecord] = []
    current_stage: Optional[ProcessingStage] = None
    
    class Settings:
        name = "documents"


class ExtractedField(BaseModel):
    value: Any
    confidence: float
    source: Optional[str] = None
    field_type: str
    extraction_method: Optional[str] = None
    extracted_at: datetime = datetime.utcnow()


class ValidationError(BaseModel):
    field: str
    message: str
    severity: str  # low, medium, high
    error_type: str


class ProcessedDocument(Document):
    document_id: str
    organization_id: str
    entity_id: Optional[str] = None
    document_type: Optional[DocumentType] = None
    acord_form_number: Optional[str] = None
    created_at: datetime = datetime.utcnow()
    extraction_completed_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None
    extracted_fields: Dict[str, ExtractedField] = {}
    requested_fields: List[str] = []
    extraction_success_rate: Optional[float] = None
    processing_stage: Optional[ProcessingStage] = None
    classification_scores: Dict[str, float] = {}
    classification_confidence: Optional[float] = None
    processing_metadata: Dict[str, Any] = {}
    validation_errors: List[ValidationError] = []
    is_valid: Optional[bool] = None
    
    class Settings:
        name = "processed_documents"


# Request/Response models
class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    status: DocumentStatus
    created_at: datetime
    file_size: int
    organization_id: str
    entity_id: Optional[str] = None
    entity_name: Optional[str] = None
    entity_type: Optional[str] = None


class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    status: DocumentStatus
    created_at: datetime
    file_size: int
    organization_id: str
    entity_id: Optional[str] = None
    entity_name: Optional[str] = None
    entity_type: Optional[str] = None
    error_message: Optional[str] = None
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None
    current_stage: Optional[ProcessingStage] = None
    stage_history: List[ProcessingStageRecord] = []
    processing_duration_seconds: Optional[float] = None


class DocumentDataResponse(BaseModel):
    document_type: Optional[DocumentType] = None
    classification_scores: Dict[str, float] = {}
    extracted_fields: Dict[str, ExtractedField] = {}
    validation_errors: List[ValidationError] = []
    is_valid: Optional[bool] = None
    processing_metadata: Dict[str, Any] = {}
    extraction_completed_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None
    extracted_text: Optional[str] = None


class DocumentStatusResponse(BaseModel):
    document_id: str
    filename: str
    status: DocumentStatus
    current_stage: Optional[ProcessingStage] = None
    stage_history: List[ProcessingStageRecord] = []
    processing_duration_seconds: Optional[float] = None
    is_stuck: bool = False
    stuck_stage: Optional[ProcessingStage] = None
    error_message: Optional[str] = None
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None
    document_type: Optional[DocumentType] = None
    classification_confidence: Optional[float] = None
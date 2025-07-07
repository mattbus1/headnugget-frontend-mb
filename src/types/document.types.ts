export interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'active';
  created_at: string;
  organization_id: string;
  entity_id?: string;
  entity_name?: string;
  entity_type?: string;
  error_message?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  current_stage?: string;
  stage_history?: ProcessingStageRecord[];
  processing_duration_seconds?: number;
  // Legacy fields for backward compatibility
  name?: string;
  size?: number;
  type?: string;
  uploadDate?: string;
  modifiedDate?: string;
  version?: string;
  tags?: string[];
  category?: string;
  url?: string;
}

export interface UploadProgress {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  documentId?: string;
  entityId?: string;
}

export interface DocumentUploadProps {
  onUpload: (files: File[]) => void;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  multiple?: boolean;
  disabled?: boolean;
}

export interface DocumentGridProps {
  documents: Document[];
  onDelete?: (id: string) => void;
  onDownload?: (id: string) => void;
  loading?: boolean;
}

export interface UploadProgressProps {
  uploads: UploadProgress[];
  onCancel?: (id: string) => void;
}

export interface DocumentLibraryProps {
  initialDocuments?: Document[];
}

// API Response types for Connor's FastAPI backend
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface UploadResponse {
  id: string;
  filename: string;
  file_type: string;
  status: string;
  created_at: string;
  file_size: number;
  organization_id: string;
  entity_id?: string;
  entity_name?: string;
  entity_type?: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
}

// PolicyStack backend types
export interface ProcessingStageRecord {
  stage: string;
  started_at: string;
  completed_at?: string;
  status: string;
  duration_seconds?: number;
  error_message?: string;
}

export interface DocumentStatusResponse {
  document_id: string;
  filename: string;
  status: string;
  current_stage?: string;
  stage_history: ProcessingStageRecord[];
  processing_duration_seconds?: number;
  is_stuck: boolean;
  stuck_stage?: string;
  error_message?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
}

export interface DocumentDataResponse {
  extracted_text?: string;
  processing_metadata: Record<string, any>;
}

// File validation types
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileValidationRules {
  maxSize: number;
  allowedTypes: string[];
}
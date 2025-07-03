export interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  modifiedDate: string;
  version: string;
  status: 'active' | 'processing' | 'error';
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
  documentId: string;
  jobId?: string; // For Celery background processing
  status: 'uploaded' | 'processing';
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
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
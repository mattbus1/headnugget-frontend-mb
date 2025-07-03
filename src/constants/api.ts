// API Configuration for Connor's FastAPI backend
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Document API endpoints
export const API_ENDPOINTS = {
  // Document management
  DOCUMENTS: '/api/documents',
  DOCUMENT_UPLOAD: '/api/documents/upload',
  DOCUMENT_DELETE: (id: string) => `/api/documents/${id}`,
  DOCUMENT_DOWNLOAD: (id: string) => `/api/documents/${id}/download`,
  
  // Celery job status for OCR processing
  JOB_STATUS: (jobId: string) => `/api/jobs/${jobId}/status`,
  
  // AWS S3 direct upload (if implemented)
  PRESIGNED_URL: '/api/documents/presigned-url',
} as const;

// File validation constants
export const FILE_VALIDATION = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp'
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
} as const;

// Upload progress polling interval
export const POLLING_INTERVAL = 2000; // 2 seconds
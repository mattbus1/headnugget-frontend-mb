// API Configuration for Connor's FastAPI backend
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Document API endpoints
export const API_ENDPOINTS = {
  // Document management
  DOCUMENTS: '/api/documents',
  DOCUMENT_UPLOAD: '/api/documents/upload',
  DOCUMENT_DELETE: (id: string) => `/api/documents/${id}`,
  DOCUMENT_DOWNLOAD: (id: string) => `/api/documents/${id}/download`,
  DOCUMENT_STATUS: (id: string) => `/api/documents/${id}/status`,
  DOCUMENT_DATA: (id: string) => `/api/documents/${id}/data`,
  DOCUMENT_REPROCESS: (id: string) => `/api/documents/${id}/reprocess`,
  DOCUMENT_UPDATE_ENTITY: (id: string) => `/api/documents/${id}/entity`,
  
  // Entity management
  ENTITIES: '/api/entities',
  
  // Dashboard and analytics
  DASHBOARD_STATS: '/api/dashboard/stats',
  ANALYTICS_PREMIUM: (entityId: string) => `/api/analytics/premium-summary/${entityId}`,
  ANALYTICS_OVERVIEW: '/api/analytics/organization-premium-overview',
} as const;

// File validation constants (matching PolicyStack backend)
export const FILE_VALIDATION = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB (matching backend limit)
  ALLOWED_TYPES: [
    'application/pdf',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/tiff'
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.txt', '.jpg', '.jpeg', '.png', '.tiff']
} as const;

// Upload progress polling interval
export const POLLING_INTERVAL = 2000; // 2 seconds
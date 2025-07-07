import axios, { AxiosError } from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import type {
  Document,
  FileValidationResult,
  FileValidationRules
} from '../types/document.types';
import { FILE_VALIDATION } from '../constants/api';

class DocumentService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // File validation utilities
  validateFile(file: File, rules: FileValidationRules = { maxSize: FILE_VALIDATION.MAX_FILE_SIZE, allowedTypes: [...FILE_VALIDATION.ALLOWED_TYPES] }): FileValidationResult {
    if (file.size > rules.maxSize) {
      return {
        isValid: false,
        error: `File size must be less than ${Math.round(rules.maxSize / (1024 * 1024))}MB`
      };
    }

    if (!rules.allowedTypes.includes(file.type)) {
      const allowedExtensions = FILE_VALIDATION.ALLOWED_EXTENSIONS.join(', ');
      return {
        isValid: false,
        error: `File type not supported. Allowed types: ${allowedExtensions}`
      };
    }

    return { isValid: true };
  }

  validateMultipleFiles(files: File[]): FileValidationResult[] {
    return files.map(file => this.validateFile(file));
  }

  // API call utilities with JWT token authentication
  private async makeRequest<T>(endpoint: string, options: any = {}): Promise<T> {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        ...options.headers
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios({
        url: `${this.baseURL}${endpoint}`,
        method: options.method || 'GET',
        headers,
        data: options.data,
        params: options.params,
        timeout: 30000
      });

      return response.data;
    } catch (error: any) {
      console.error('API request failed:', error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
      }
      
      throw this.handleError(error);
    }
  }

  private handleError(error: AxiosError): Error {
    if (error.response?.data && typeof error.response.data === 'object') {
      const errorData = error.response.data as any;
      return new Error(errorData.detail || errorData.message || 'An error occurred');
    }
    
    return new Error(error.message || 'An unexpected error occurred');
  }

  // Document API methods for PolicyStack FastAPI backend
  async uploadDocument(file: File, entityId?: string): Promise<any> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const formData = new FormData();
    formData.append('file', file);
    if (entityId) {
      formData.append('entity_id', entityId);
    }

    try {
      const token = localStorage.getItem('auth_token');
      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.post(
        `${this.baseURL}${API_ENDPOINTS.DOCUMENT_UPLOAD}`,
        formData,
        {
          headers,
          timeout: 60000, // 60 seconds for file upload
          onUploadProgress: (progressEvent) => {
            // This will be handled by the calling component
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Document upload failed:', error);
      throw this.handleError(error);
    }
  }

  async uploadMultipleDocuments(files: File[], entityId?: string): Promise<any[]> {
    const validationResults = this.validateMultipleFiles(files);
    const invalidFiles = validationResults.filter(result => !result.isValid);
    
    if (invalidFiles.length > 0) {
      throw new Error(`Some files are invalid: ${invalidFiles.map(r => r.error).join(', ')}`);
    }

    // Upload files sequentially to avoid overwhelming the server
    const results: any[] = [];
    for (const file of files) {
      try {
        const result = await this.uploadDocument(file, entityId);
        results.push(result);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        throw error;
      }
    }

    return results;
  }

  async getDocuments(page: number = 1, limit: number = 20, status?: string, entityId?: string): Promise<any[]> {
    const params: any = { page, limit };
    if (status) params.status = status;
    if (entityId) params.entity_id = entityId;

    const response = await this.makeRequest<any[]>(API_ENDPOINTS.DOCUMENTS, {
      params
    });
    return response;
  }

  async deleteDocument(id: string): Promise<void> {
    await this.makeRequest<void>(`/api/documents/${id}`, {
      method: 'DELETE'
    });
  }

  async downloadDocument(id: string): Promise<Blob> {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get(`${this.baseURL}/api/documents/${id}/download`, {
        headers,
        responseType: 'blob'
      });

      return response.data;
    } catch (error: any) {
      console.error('Document download failed:', error);
      throw this.handleError(error);
    }
  }

  // Document status polling for processing updates
  async getDocumentStatus(documentId: string): Promise<any> {
    return this.makeRequest<any>(`/api/documents/${documentId}/status`);
  }

  async getDocumentData(documentId: string): Promise<any> {
    return this.makeRequest<any>(`/api/documents/${documentId}/data`);
  }

  async reprocessDocument(documentId: string): Promise<any> {
    return this.makeRequest<any>(`/api/documents/${documentId}/reprocess`, {
      method: 'POST'
    });
  }

  async updateDocumentEntity(documentId: string, entityId?: string): Promise<any> {
    return this.makeRequest<any>(`/api/documents/${documentId}/entity`, {
      method: 'PATCH',
      data: { entity_id: entityId }
    });
  }

  // Mock data for development (remove when backend is ready)
  getMockDocuments(): Document[] {
    return [
      {
        id: '1',
        filename: 'Commercial Property Policy Insurance.pdf',
        file_type: 'application/pdf',
        file_size: 2.4 * 1024 * 1024,
        status: 'completed' as const,
        created_at: '2024-12-14T10:00:00Z',
        organization_id: 'demo-org',
        entity_id: 'entity-1',
        entity_name: 'Main Office',
        entity_type: 'location',
        // Legacy fields for backward compatibility
        name: 'Commercial Property Policy Insurance.pdf',
        size: 2.4 * 1024 * 1024,
        type: 'application/pdf',
        uploadDate: '2024-12-14',
        modifiedDate: '2024-12-14',
        version: 'v1.0',
        tags: ['Policy', 'Property'],
        category: 'Insurance'
      },
      {
        id: '2',
        filename: 'Broker Proposal Comparison.xlsx',
        file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        file_size: 4.8 * 1024 * 1024,
        status: 'completed' as const,
        created_at: '2024-12-12T14:30:00Z',
        organization_id: 'demo-org',
        entity_id: 'entity-2',
        entity_name: 'ACME Client',
        entity_type: 'client',
        // Legacy fields for backward compatibility
        name: 'Broker Proposal Comparison.xlsx',
        size: 4.8 * 1024 * 1024,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadDate: '2024-12-12',
        modifiedDate: '2024-12-12',
        version: 'v1.1',
        tags: ['Broker', 'Proposal'],
        category: 'Proposals'
      },
      {
        id: '3',
        filename: 'General Liability Certificate.pdf',
        file_type: 'application/pdf',
        file_size: 1.8 * 1024 * 1024,
        status: 'completed' as const,
        created_at: '2024-12-11T09:15:00Z',
        organization_id: 'demo-org',
        // Legacy fields for backward compatibility
        name: 'General Liability Certificate.pdf',
        size: 1.8 * 1024 * 1024,
        type: 'application/pdf',
        uploadDate: '2024-12-11',
        modifiedDate: '2024-12-11',
        version: 'v2.1',
        tags: ['Certificate', 'Liability'],
        category: 'Certificates'
      },
      {
        id: '4',
        filename: '2024 Claims Summary Report.docx',
        file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_size: 856 * 1024,
        status: 'completed' as const,
        created_at: '2024-12-07T16:45:00Z',
        organization_id: 'demo-org',
        // Legacy fields for backward compatibility
        name: '2024 Claims Summary Report.docx',
        size: 856 * 1024,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadDate: '2024-12-07',
        modifiedDate: '2024-12-07',
        version: 'v1.0',
        tags: ['Claims', 'Report'],
        category: 'Reports'
      }
    ];
  }
}

// Export singleton instance
export const documentService = new DocumentService();
export default documentService;
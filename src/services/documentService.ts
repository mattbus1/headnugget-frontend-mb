import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import type {
  Document,
  ApiResponse,
  UploadResponse,
  DocumentListResponse,
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

  // API call utilities with Auth0 token ready
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // TODO: Add Auth0 token when authentication is implemented
      // const token = await getAccessTokenSilently();
      // headers: { 
      //   'Authorization': `Bearer ${token}`,
      //   ...options.headers 
      // }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Document API methods ready for Connor's FastAPI backend
  async uploadDocument(file: File): Promise<UploadResponse> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.DOCUMENT_UPLOAD}`, {
        method: 'POST',
        // TODO: Add Auth0 token headers when implemented
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Document upload failed:', error);
      throw error;
    }
  }

  async uploadMultipleDocuments(files: File[]): Promise<UploadResponse[]> {
    const validationResults = this.validateMultipleFiles(files);
    const invalidFiles = validationResults.filter(result => !result.isValid);
    
    if (invalidFiles.length > 0) {
      throw new Error(`Some files are invalid: ${invalidFiles.map(r => r.error).join(', ')}`);
    }

    // Upload files sequentially to avoid overwhelming the server
    const results: UploadResponse[] = [];
    for (const file of files) {
      try {
        const result = await this.uploadDocument(file);
        results.push(result);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        throw error;
      }
    }

    return results;
  }

  async getDocuments(page: number = 1, limit: number = 20): Promise<DocumentListResponse> {
    const response = await this.makeRequest<DocumentListResponse>(
      `${API_ENDPOINTS.DOCUMENTS}?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  async deleteDocument(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(API_ENDPOINTS.DOCUMENT_DELETE(id), {
      method: 'DELETE'
    });
  }

  async downloadDocument(id: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.DOCUMENT_DOWNLOAD(id)}`, {
        // TODO: Add Auth0 token headers when implemented
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Document download failed:', error);
      throw error;
    }
  }

  // Celery job status polling for OCR processing
  async getJobStatus(jobId: string): Promise<ApiResponse<{ status: string; progress?: number; result?: any }>> {
    return this.makeRequest<{ status: string; progress?: number; result?: any }>(
      API_ENDPOINTS.JOB_STATUS(jobId)
    );
  }

  // Mock data for development (remove when backend is ready)
  getMockDocuments(): Document[] {
    return [
      {
        id: '1',
        name: 'Commercial Property Policy Insurance.pdf',
        size: 2.4 * 1024 * 1024,
        type: 'application/pdf',
        uploadDate: '2024-12-14',
        modifiedDate: '2024-12-14',
        version: 'v1.0',
        status: 'active',
        tags: ['Policy', 'Property'],
        category: 'Insurance'
      },
      {
        id: '2',
        name: 'Broker Proposal Comparison.xlsx',
        size: 4.8 * 1024 * 1024,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadDate: '2024-12-12',
        modifiedDate: '2024-12-12',
        version: 'v1.1',
        status: 'active',
        tags: ['Broker', 'Proposal'],
        category: 'Proposals'
      },
      {
        id: '3',
        name: 'General Liability Certificate.pdf',
        size: 1.8 * 1024 * 1024,
        type: 'application/pdf',
        uploadDate: '2024-12-11',
        modifiedDate: '2024-12-11',
        version: 'v2.1',
        status: 'active',
        tags: ['Certificate', 'Liability'],
        category: 'Certificates'
      },
      {
        id: '4',
        name: '2024 Claims Summary Report.docx',
        size: 856 * 1024,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadDate: '2024-12-07',
        modifiedDate: '2024-12-07',
        version: 'v1.0',
        status: 'active',
        tags: ['Claims', 'Report'],
        category: 'Reports'
      }
    ];
  }
}

// Export singleton instance
export const documentService = new DocumentService();
export default documentService;
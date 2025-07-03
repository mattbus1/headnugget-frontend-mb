import { useState, useCallback } from 'react';
import { documentService } from '../services/documentService';
import type { UploadProgress, UploadResponse } from '../types/document.types';

interface UseDocumentUploadReturn {
  uploads: UploadProgress[];
  isUploading: boolean;
  uploadFiles: (files: File[]) => Promise<void>;
  cancelUpload: (id: string) => void;
  clearCompleted: () => void;
}

export const useDocumentUpload = (): UseDocumentUploadReturn => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const generateUploadId = () => `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const updateUpload = useCallback((id: string, updates: Partial<UploadProgress>) => {
    setUploads(prev => prev.map(upload => 
      upload.id === id ? { ...upload, ...updates } : upload
    ));
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
  }, []);

  const uploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    // Create upload progress entries
    const newUploads: UploadProgress[] = files.map(file => ({
      id: generateUploadId(),
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }));

    setUploads(prev => [...prev, ...newUploads]);

    try {
      // Process uploads sequentially to avoid overwhelming the server
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadId = newUploads[i].id;

        try {
          // Simulate progress updates (replace with actual progress when available)
          updateUpload(uploadId, { progress: 25 });
          
          // Validate file before upload
          const validation = documentService.validateFile(file);
          if (!validation.isValid) {
            updateUpload(uploadId, { 
              status: 'error', 
              error: validation.error,
              progress: 0
            });
            continue;
          }

          updateUpload(uploadId, { progress: 50 });

          // Perform the actual upload
          const result: UploadResponse = await documentService.uploadDocument(file);
          
          updateUpload(uploadId, { progress: 75 });

          // If there's a job ID, the file is being processed (OCR, etc.)
          if (result.jobId) {
            updateUpload(uploadId, { 
              status: 'processing',
              progress: 90
            });

            // Poll for job completion (simplified - you might want to implement this differently)
            // In a real implementation, you'd poll the job status endpoint
            setTimeout(() => {
              updateUpload(uploadId, { 
                status: 'completed',
                progress: 100
              });
            }, 3000);
          } else {
            // Upload completed immediately
            updateUpload(uploadId, { 
              status: 'completed',
              progress: 100
            });
          }

        } catch (error) {
          console.error(`Upload failed for ${file.name}:`, error);
          updateUpload(uploadId, { 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload failed',
            progress: 0
          });
        }
      }
    } finally {
      setIsUploading(false);
    }
  }, [updateUpload]);

  const cancelUpload = useCallback((id: string) => {
    // In a real implementation, you'd cancel the actual upload request
    removeUpload(id);
  }, [removeUpload]);

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(upload => 
      upload.status !== 'completed' && upload.status !== 'error'
    ));
  }, []);

  return {
    uploads,
    isUploading,
    uploadFiles,
    cancelUpload,
    clearCompleted
  };
};
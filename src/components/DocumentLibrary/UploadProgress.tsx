import React from 'react';
import { X, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import type { UploadProgressProps } from '../../types/document.types';

const UploadProgress: React.FC<UploadProgressProps> = ({ uploads, onCancel }) => {
  if (uploads.length === 0) return null;

  const getStatusIcon = (status: string, progress: number) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />;
      case 'uploading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'processing':
        return 'bg-amber-500';
      case 'uploading':
        return 'bg-blue-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Upload Progress</h4>
        <span className="text-xs text-gray-500">
          {uploads.filter(u => u.status === 'completed').length} of {uploads.length} completed
        </span>
      </div>
      
      <div className="space-y-2">
        {uploads.map((upload) => (
          <div
            key={upload.id}
            className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getStatusIcon(upload.status, upload.progress)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {upload.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getStatusText(upload.status)}
                    {upload.status === 'uploading' || upload.status === 'processing' 
                      ? ` (${upload.progress}%)` 
                      : ''
                    }
                  </p>
                </div>
              </div>
              
              {/* Cancel/Remove Button */}
              {onCancel && (upload.status === 'uploading' || upload.status === 'error') && (
                <button
                  onClick={() => onCancel(upload.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title={upload.status === 'error' ? 'Remove' : 'Cancel'}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Progress Bar */}
            {(upload.status === 'uploading' || upload.status === 'processing') && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(upload.status)}`}
                  style={{ 
                    width: `${Math.min(upload.progress, 100)}%`,
                    backgroundColor: upload.status === 'processing' ? '#8B7355' : undefined
                  }}
                />
              </div>
            )}
            
            {/* Error Message */}
            {upload.status === 'error' && upload.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                {upload.error}
              </div>
            )}
            
            {/* Success Message */}
            {upload.status === 'completed' && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-600">
                Upload completed successfully
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Summary Stats */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs text-gray-500">
        <span>
          {uploads.filter(u => u.status === 'uploading' || u.status === 'processing').length > 0
            ? `${uploads.filter(u => u.status === 'uploading' || u.status === 'processing').length} files uploading...`
            : 'All uploads complete'
          }
        </span>
        <span>
          {uploads.filter(u => u.status === 'error').length > 0 && (
            <span className="text-red-500">
              {uploads.filter(u => u.status === 'error').length} failed
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default UploadProgress;
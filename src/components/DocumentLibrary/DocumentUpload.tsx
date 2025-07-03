import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';
import type { DocumentUploadProps } from '../../types/document.types';
import { FILE_VALIDATION } from '../../constants/api';

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  maxFileSize = FILE_VALIDATION.MAX_FILE_SIZE,
  acceptedFileTypes = FILE_VALIDATION.ALLOWED_TYPES,
  multiple = true,
  disabled = false
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/zip': ['.zip'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/bmp': ['.bmp'],
      'image/webp': ['.webp']
    },
    maxSize: maxFileSize,
    multiple,
    disabled
  });

  const formatFileSize = (bytes: number) => {
    return `${Math.round(bytes / (1024 * 1024))}MB`;
  };

  const getDropzoneClasses = () => {
    let classes = 'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer';
    
    if (disabled) {
      classes += ' border-gray-300 bg-gray-50 cursor-not-allowed';
    } else if (isDragReject) {
      classes += ' border-red-400 bg-red-50';
    } else if (isDragActive) {
      classes += ' border-amber-400 bg-amber-50';
    } else {
      classes += ' border-amber-300 bg-amber-25 hover:border-amber-400 hover:bg-amber-50';
    }
    
    return classes;
  };

  const getTextColor = () => {
    if (disabled) return 'text-gray-500';
    if (isDragReject) return 'text-red-600';
    if (isDragActive) return 'text-amber-700';
    return 'text-gray-700';
  };

  return (
    <div className="w-full">
      <div {...getRootProps()} className={getDropzoneClasses()}>
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {/* Upload Icon */}
          <div className="relative">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <Upload 
                className={`w-8 h-8 ${
                  disabled ? 'text-gray-400' : 
                  isDragActive ? 'text-amber-600' : 'text-amber-500'
                }`} 
              />
            </div>
            {isDragActive && (
              <div className="absolute inset-0 w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center animate-pulse">
                <Upload className="w-8 h-8 text-amber-700" />
              </div>
            )}
          </div>

          {/* Upload Text */}
          <div className="space-y-2">
            <h3 className={`text-lg font-medium ${getTextColor()}`}>
              {isDragActive ? (
                isDragReject ? 'Some files cannot be uploaded' : 'Drop files here'
              ) : (
                'Drop files here or click to upload'
              )}
            </h3>
            
            <p className={`text-sm ${getTextColor()}`}>
              Supports PDF, DOC, XLS, PPT, ZIP and image files up to {formatFileSize(maxFileSize)}
            </p>
          </div>

          {/* Choose Files Button */}
          {!isDragActive && (
            <button
              type="button"
              disabled={disabled}
              className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                disabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-amber-600 text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2'
              }`}
              style={{ backgroundColor: disabled ? undefined : '#8B7355' }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = '#795F47';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = '#8B7355';
                }
              }}
            >
              Choose Files
            </button>
          )}

          {/* File Types Info */}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <FileText className="w-3 h-3" />
              <span>PDF, DOC, XLS</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="w-3 h-3" />
              <span>PPT, ZIP, Images</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {isDragReject && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            Some files cannot be uploaded. Please check file types and sizes.
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
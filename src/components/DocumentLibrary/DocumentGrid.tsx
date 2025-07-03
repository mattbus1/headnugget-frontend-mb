import React from 'react';
import { FileText, Download, Trash2, Calendar, HardDrive, Tag } from 'lucide-react';
import type { DocumentGridProps } from '../../types/document.types';

const DocumentGrid: React.FC<DocumentGridProps> = ({ 
  documents, 
  onDelete, 
  onDownload, 
  loading = false 
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getFileIcon = (type: string) => {
    // You could expand this to show different icons for different file types
    return <FileText className="w-8 h-8 text-amber-600" style={{ color: '#8B7355' }} />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Processing
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Error
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-300 rounded w-full"></div>
              <div className="h-3 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
        <p className="text-gray-500">Upload your first document to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((document) => (
        <div
          key={document.id}
          className="bg-white rounded-lg border border-gray-200 hover:border-amber-300 transition-colors duration-200 overflow-hidden shadow-sm hover:shadow-md"
        >
          {/* Document Header */}
          <div className="p-4 pb-3">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getFileIcon(document.type)}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate" title={document.name}>
                    {document.name}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusBadge(document.status)}
                    <span className="text-xs text-gray-500">v{document.version}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-1 ml-2">
                {onDownload && (
                  <button
                    onClick={() => onDownload(document.id)}
                    className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                    title="Download"
                    style={{ color: '#8B7355' }}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(document.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Document Details */}
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <HardDrive className="w-3 h-3" />
                  <span>{formatFileSize(document.size)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(document.modifiedDate)}</span>
                </div>
              </div>
              
              {/* Category and Tags */}
              {(document.category || (document.tags && document.tags.length > 0)) && (
                <div className="flex items-center space-x-2 pt-1">
                  {document.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                      {document.category}
                    </span>
                  )}
                  {document.tags && document.tags.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Tag className="w-3 h-3" />
                      <div className="flex flex-wrap gap-1">
                        {document.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700"
                            style={{ backgroundColor: '#FEF3C7', color: '#8B7355' }}
                          >
                            {tag}
                          </span>
                        ))}
                        {document.tags.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{document.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Document Footer */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Modified: {formatDate(document.modifiedDate)}</span>
              <span className="text-amber-600" style={{ color: '#8B7355' }}>
                {document.status === 'active' ? 'Ready' : 
                 document.status === 'processing' ? 'Processing...' : 'Error'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentGrid;
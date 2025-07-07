import React, { useState, useEffect } from 'react';
import { Upload as UploadIcon, Search, Grid, List, Download } from 'lucide-react';
import DocumentUpload from './DocumentUpload';
import DocumentGrid from './DocumentGrid';
import UploadProgress from './UploadProgress';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';
import { documentService } from '../../services/documentService';
import type { Document, DocumentLibraryProps } from '../../types/document.types';

const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ initialDocuments = [] }) => {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Documents');
  
  const { uploads, uploadFiles, cancelUpload } = useDocumentUpload();

  // Load documents from PolicyStack backend
  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await documentService.getDocuments(1, 50);
        
        // Transform backend response to frontend format
        const transformedDocuments: Document[] = response.map(doc => ({
          id: doc.id,
          filename: doc.filename,
          file_type: doc.file_type,
          file_size: doc.file_size,
          status: doc.status,
          created_at: doc.created_at,
          organization_id: doc.organization_id,
          entity_id: doc.entity_id,
          entity_name: doc.entity_name,
          entity_type: doc.entity_type,
          error_message: doc.error_message,
          processing_started_at: doc.processing_started_at,
          processing_completed_at: doc.processing_completed_at,
          current_stage: doc.current_stage,
          stage_history: doc.stage_history,
          processing_duration_seconds: doc.processing_duration_seconds,
          // Legacy fields for compatibility
          name: doc.filename,
          size: doc.file_size,
          type: doc.file_type,
          uploadDate: doc.created_at?.split('T')[0] || '',
          modifiedDate: doc.created_at?.split('T')[0] || '',
          version: 'v1.0',
          category: doc.entity_name || 'Uploads'
        }));
        
        setDocuments(transformedDocuments);
      } catch (error) {
        console.error('Failed to load documents:', error);
        setError(error instanceof Error ? error.message : 'Failed to load documents');
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, []);

  // Handle file upload using PolicyStack backend
  const handleUpload = async (files: File[]) => {
    try {
      setError(null);
      await uploadFiles(files);
      
      // Refresh documents list after upload
      const response = await documentService.getDocuments(1, 50);
      
      // Transform backend response to frontend format
      const transformedDocuments: Document[] = response.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        file_type: doc.file_type,
        file_size: doc.file_size,
        status: doc.status,
        created_at: doc.created_at,
        organization_id: doc.organization_id,
        entity_id: doc.entity_id,
        entity_name: doc.entity_name,
        entity_type: doc.entity_type,
        error_message: doc.error_message,
        processing_started_at: doc.processing_started_at,
        processing_completed_at: doc.processing_completed_at,
        current_stage: doc.current_stage,
        stage_history: doc.stage_history,
        processing_duration_seconds: doc.processing_duration_seconds,
        // Legacy fields for compatibility
        name: doc.filename,
        size: doc.file_size,
        type: doc.file_type,
        uploadDate: doc.created_at?.split('T')[0] || '',
        modifiedDate: doc.created_at?.split('T')[0] || '',
        version: 'v1.0',
        category: doc.entity_name || 'Uploads'
      }));
      
      setDocuments(transformedDocuments);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  // Handle document deletion using PolicyStack backend
  const handleDelete = async (id: string) => {
    try {
      await documentService.deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  // Handle document download using PolicyStack backend
  const handleDownload = async (id: string) => {
    try {
      const documentToDownload = documents.find(doc => doc.id === id);
      if (!documentToDownload) {
        console.error('Document not found');
        return;
      }

      const blob = await documentService.downloadDocument(id);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = documentToDownload.filename || documentToDownload.name || 'document';
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  // Filter documents based on search and category
  const filteredDocuments = documents.filter(doc => {
    const documentName = doc.filename || doc.name || '';
    const matchesSearch = documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         doc.entity_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All Documents' || 
                           doc.category === selectedCategory ||
                           doc.entity_name === selectedCategory ||
                           doc.status === selectedCategory.toLowerCase();
                           
    return matchesSearch && matchesCategory;
  });

  // Get document statistics
  const stats = {
    total: documents.length,
    active: documents.filter(d => d.status === 'completed').length,
    processing: documents.filter(d => d.status === 'processing' || d.status === 'pending').length,
    totalSize: documents.reduce((sum, doc) => sum + (doc.file_size || doc.size || 0), 0)
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const categories = [
    'All Documents',
    ...Array.from(new Set(documents.map(d => d.entity_name || d.category).filter(Boolean))),
    'Completed',
    'Processing',
    'Failed'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Document Library</h1>
              <p className="text-gray-600 mt-1">
                University of Mount Union - Centralized document management and storage
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors duration-200"
                style={{ backgroundColor: '#8B7355' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#795F47';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#8B7355';
                }}
              >
                <UploadIcon className="w-4 h-4 mr-2" />
                {showUpload ? 'Hide Upload' : 'New Document'}
              </button>
              
              <button
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Bulk Upload
              </button>
            </div>
          </div>

          {/* Document Statistics */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total documents</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-amber-600" style={{ color: '#8B7355' }}>
                {stats.processing}
              </div>
              <div className="text-sm text-gray-500">Processing</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{formatFileSize(stats.totalSize)}</div>
              <div className="text-sm text-gray-500">Storage</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Upload Section */}
        {showUpload && (
          <div className="mb-8">
            <DocumentUpload onUpload={handleUpload} />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploads.length > 0 && (
          <div className="mb-8">
            <UploadProgress uploads={uploads} onCancel={cancelUpload} />
          </div>
        )}

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-4">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-amber-100 text-amber-700' : 'text-gray-400'}`}
                  style={{ 
                    backgroundColor: viewMode === 'grid' ? '#FEF3C7' : undefined,
                    color: viewMode === 'grid' ? '#8B7355' : undefined
                  }}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-amber-100 text-amber-700' : 'text-gray-400'}`}
                  style={{ 
                    backgroundColor: viewMode === 'list' ? '#FEF3C7' : undefined,
                    color: viewMode === 'list' ? '#8B7355' : undefined
                  }}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        <DocumentGrid
          documents={filteredDocuments}
          onDelete={handleDelete}
          onDownload={handleDownload}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default DocumentLibrary;
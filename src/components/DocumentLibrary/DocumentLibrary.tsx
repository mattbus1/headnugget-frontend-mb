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
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Documents');
  
  const { uploads, uploadFiles, cancelUpload } = useDocumentUpload();

  // Load documents on component mount (using mock data for now)
  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call when backend is ready
        // const response = await documentService.getDocuments();
        // setDocuments(response.data.documents);
        
        // Using mock data for now
        const mockDocuments = documentService.getMockDocuments();
        setDocuments(mockDocuments);
      } catch (error) {
        console.error('Failed to load documents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, []);

  // Handle file upload
  const handleUpload = async (files: File[]) => {
    try {
      await uploadFiles(files);
      
      // Refresh documents after upload (in a real app, you might want to add the new documents directly)
      // For now, we'll just simulate adding new documents
      const newDocuments = files.map((file, index) => ({
        id: `temp_${Date.now()}_${index}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString().split('T')[0],
        modifiedDate: new Date().toISOString().split('T')[0],
        version: 'v1.0',
        status: 'processing' as const,
        category: 'Uploads'
      }));

      // Add new documents to the list
      setDocuments(prev => [...newDocuments, ...prev]);
      
      // Simulate processing completion after 3 seconds
      setTimeout(() => {
        setDocuments(prev => 
          prev.map(doc => 
            newDocuments.some(newDoc => newDoc.id === doc.id)
              ? { ...doc, status: 'active' as const }
              : doc
          )
        );
      }, 3000);
      
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  // Handle document deletion
  const handleDelete = async (id: string) => {
    try {
      // TODO: Replace with actual API call when backend is ready
      // await documentService.deleteDocument(id);
      
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  // Handle document download
  const handleDownload = async (id: string) => {
    try {
      // TODO: Replace with actual API call when backend is ready
      // const blob = await documentService.downloadDocument(id);
      // const url = URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = document.name;
      // a.click();
      
      console.log('Download document:', id);
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  // Filter documents based on search and category
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All Documents' || 
                           doc.category === selectedCategory ||
                           doc.status === selectedCategory.toLowerCase();
                           
    return matchesSearch && matchesCategory;
  });

  // Get document statistics
  const stats = {
    total: documents.length,
    active: documents.filter(d => d.status === 'active').length,
    processing: documents.filter(d => d.status === 'processing').length,
    totalSize: documents.reduce((sum, doc) => sum + doc.size, 0)
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const categories = [
    'All Documents',
    ...Array.from(new Set(documents.map(d => d.category).filter(Boolean))),
    'Active',
    'Processing'
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
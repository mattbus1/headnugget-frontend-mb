import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Layout from './components/Layout';
import DocumentLibrary from './components/DocumentLibrary/DocumentLibrary';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        if (error?.status_code === 401) return false;
        return failureCount < 3;
      },
    },
  },
});

// Dashboard component
const Dashboard: React.FC = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
    <p className="text-gray-600 mt-4">Insurance Intelligence Dashboard</p>
  </div>
);

// Calendar component
const Calendar: React.FC = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
    <p className="text-gray-600 mt-4">Policy and Claims Calendar</p>
  </div>
);

// Policy Comparison component
const PolicyComparison: React.FC = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-gray-900">Policy Comparison</h1>
    <p className="text-gray-600 mt-4">Compare Insurance Policies</p>
  </div>
);

// Settings component
const Settings: React.FC = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
    <p className="text-gray-600 mt-4">Application Settings</p>
  </div>
);

// Help component
const Help: React.FC = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
    <p className="text-gray-600 mt-4">Get help with Headnugget</p>
  </div>
);

// Main App Layout wrapper
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
            {/* Public routes - redirect to dashboard if authenticated */}
            <Route 
              path="/login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Register />
                </ProtectedRoute>
              } 
            />

            {/* Protected routes - require authentication */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/documents" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DocumentLibrary />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calendar" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Calendar />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/policy-comparison" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PolicyComparison />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/help" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Help />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Default redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
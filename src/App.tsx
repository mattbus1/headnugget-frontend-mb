import React, { useState } from 'react';
import Layout from './components/Layout';
import DocumentLibrary from './components/DocumentLibrary/DocumentLibrary';

function App() {
  const [currentPath, setCurrentPath] = useState<string>('/');

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const renderContent = () => {
    switch (currentPath) {
      case '/documents':
        return <DocumentLibrary />;
      case '/dashboard':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-4">Insurance Intelligence Dashboard</p>
          </div>
        );
      case '/calendar':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-4">Policy and Claims Calendar</p>
          </div>
        );
      case '/policy-comparison':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900">Policy Comparison</h1>
            <p className="text-gray-600 mt-4">Compare Insurance Policies</p>
          </div>
        );
      case '/settings':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-4">Application Settings</p>
          </div>
        );
      case '/help':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
            <p className="text-gray-600 mt-4">Get help with Headnugget</p>
          </div>
        );
      default:
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Headnugget</h1>
            <p className="text-gray-600 mt-4">Insurance Intelligence Dashboard</p>
          </div>
        );
    }
  };

  return (
    <Layout 
      currentPath={currentPath}
      onNavigate={handleNavigate}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
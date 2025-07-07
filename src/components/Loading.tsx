import React from 'react';
import { Home } from 'lucide-react';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ 
  message = 'Loading...', 
  fullScreen = true 
}) => {
  const containerClasses = fullScreen
    ? 'min-h-screen bg-gray-50 flex items-center justify-center'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        {/* Brand Logo with Animation */}
        <div className="flex justify-center mb-6">
          <div 
            className="w-16 h-16 rounded-lg flex items-center justify-center animate-pulse"
            style={{ backgroundColor: '#8B7355' }}
          >
            <Home className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Spinner */}
        <div className="flex justify-center mb-4">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: '#8B7355' }}
          ></div>
        </div>

        {/* Loading Message */}
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
};

export default Loading;
import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  HelpCircle,
  Menu,
  X,
  Home
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: string;
  isNew?: boolean;
}

interface LayoutProps {
  children: React.ReactNode;
  navigationItems?: NavigationItem[];
  currentPath?: string;
  brandName?: string;
  onNavigate?: (path: string) => void;
}

const defaultNavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard'
  },
  {
    id: 'documents',
    label: 'Document Library',
    icon: FileText,
    path: '/documents'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    path: '/calendar'
  },
  {
    id: 'policy-comparison',
    label: 'Policy Comparison',
    icon: BarChart3,
    path: '/policy-comparison',
    badge: 'NEW',
    isNew: true
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings'
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: HelpCircle,
    path: '/help'
  }
];

const Layout: React.FC<LayoutProps> = ({
  children,
  navigationItems = defaultNavigationItems,
  currentPath = '',
  brandName = 'HEADNUGGET',
  onNavigate
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      console.log(`Navigation to: ${path}`);
    }
    setIsMobileMenuOpen(false);
  };

  const isActive = (itemPath: string) => {
    return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
  };

  const NavigationContent = () => (
    <>
      {/* Brand Section */}
      <div className="p-6 border-b border-amber-800/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg">{brandName}</h1>
            <p className="text-amber-100 text-sm">Enterprise Plan</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4" role="navigation" aria-label="Main navigation">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    active
                      ? 'bg-amber-800/30 text-white border-l-4 border-amber-200'
                      : 'text-amber-100 hover:bg-amber-800/20 hover:text-white'
                  }`}
                  aria-current={active ? 'page' : undefined}
                  aria-label={`Navigate to ${item.label}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.isNew 
                        ? 'bg-green-500 text-white' 
                        : 'bg-amber-200 text-amber-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside 
        className="hidden lg:flex lg:flex-col lg:w-64 bg-amber-800 text-white"
        style={{ backgroundColor: '#8B7355' }}
        aria-label="Sidebar navigation"
      >
        <NavigationContent />
      </aside>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 bg-amber-800 text-white rounded-lg shadow-lg"
          style={{ backgroundColor: '#8B7355' }}
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          
          {/* Sidebar */}
          <aside 
            className="relative flex flex-col w-64 bg-amber-800 text-white transform transition-transform"
            style={{ backgroundColor: '#8B7355' }}
            aria-label="Mobile navigation"
          >
            {/* Close Button */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-amber-100 hover:text-white"
                aria-label="Close navigation menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <NavigationContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 bg-white lg:ml-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
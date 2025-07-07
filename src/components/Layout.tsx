import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  HelpCircle,
  Menu,
  X,
  Home,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';

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
  brandName?: string;
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
  brandName = 'HEADNUGGET',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthContext();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  const isActive = (itemPath: string) => {
    return location.pathname === itemPath || location.pathname.startsWith(itemPath + '/');
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

      {/* User Profile Section */}
      {user && (
        <div className="p-4 border-b border-amber-800/20">
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-amber-100 hover:bg-amber-800/20 hover:text-white transition-colors"
            >
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-amber-800" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{user.full_name}</p>
                <p className="text-xs text-amber-200 truncate">{user.email}</p>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* User Menu Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => handleNavigate('/settings')}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
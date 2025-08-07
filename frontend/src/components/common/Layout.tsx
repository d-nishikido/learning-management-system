import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileMenu } from './MobileMenu';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { useAuth } from '@/contexts';

function LayoutContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header for unauthenticated pages */}
        <header className="bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-primary-600">
                LMS System
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
            </div>
          </div>
        </header>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-0">
        {/* Top navigation */}
        <header className="bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <MobileMenu isOpen={sidebarOpen} onToggle={toggleSidebar} />
              <div className="ml-4 lg:hidden">
                <Link to="/" className="text-xl font-bold text-primary-600">
                  LMS System
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              {user && (
                <span className="hidden text-sm text-gray-700 sm:block">
                  {user.name}
                </span>
              )}
              <LogoutButton size="sm" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-600">
              © 2025 LMS System. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function Layout() {
  return <LayoutContent />;
}
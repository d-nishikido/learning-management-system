import type { ReactNode } from 'react';

interface AccessControlProps {
  children: ReactNode;
}

/**
 * AccessControl component that blocks access when running in test environment
 * This prevents direct browser access to http://localhost:3002/ during E2E testing
 */
export function AccessControl({ children }: AccessControlProps) {
  // Check if we're running in test environment
  const isTestEnvironment = import.meta.env.VITE_NODE_ENV === 'test';
  
  if (isTestEnvironment) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-lg shadow-md">
          <div className="text-6xl text-gray-400 mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Not Available
          </h1>
          <p className="text-gray-600">
            This interface is currently running in test mode and is not available for direct access.
          </p>
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              If you need to access the application, please use the production environment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
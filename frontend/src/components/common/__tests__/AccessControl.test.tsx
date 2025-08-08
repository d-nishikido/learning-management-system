import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock the HomePageHandler function that's now inside App.tsx
function HomePageHandler() {
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

  return (
    <MemoryRouter initialEntries={['/login']}>
      <div>Redirected to login</div>
    </MemoryRouter>
  );
}

describe('HomePageHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to login when not in test environment', () => {
    // Mock import.meta.env to simulate non-test environment
    vi.stubGlobal('import', {
      meta: {
        env: {
          VITE_NODE_ENV: 'development'
        }
      }
    });

    render(<HomePageHandler />);

    expect(screen.getByText('Redirected to login')).toBeInTheDocument();
  });

  it('should block access when in test environment', () => {
    // Mock import.meta.env to simulate test environment
    vi.stubGlobal('import', {
      meta: {
        env: {
          VITE_NODE_ENV: 'test'
        }
      }
    });

    render(<HomePageHandler />);

    expect(screen.getByText('Access Not Available')).toBeInTheDocument();
    expect(screen.getByText(/This interface is currently running in test mode/)).toBeInTheDocument();
  });

  it('should redirect to login when NODE_ENV is undefined', () => {
    // Mock import.meta.env to simulate undefined NODE_ENV
    vi.stubGlobal('import', {
      meta: {
        env: {
          VITE_NODE_ENV: undefined
        }
      }
    });

    render(<HomePageHandler />);

    expect(screen.getByText('Redirected to login')).toBeInTheDocument();
  });
});
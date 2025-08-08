import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccessControl } from '../AccessControl';

describe('AccessControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when not in test environment', () => {
    // Mock import.meta.env to simulate non-test environment
    vi.stubGlobal('import', {
      meta: {
        env: {
          VITE_NODE_ENV: 'development'
        }
      }
    });

    render(
      <AccessControl>
        <div data-testid="test-content">Test Content</div>
      </AccessControl>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
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

    render(
      <AccessControl>
        <div data-testid="test-content">Test Content</div>
      </AccessControl>
    );

    expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Not Available')).toBeInTheDocument();
    expect(screen.getByText(/This interface is currently running in test mode/)).toBeInTheDocument();
  });

  it('should render children when NODE_ENV is undefined', () => {
    // Mock import.meta.env to simulate undefined NODE_ENV
    vi.stubGlobal('import', {
      meta: {
        env: {
          VITE_NODE_ENV: undefined
        }
      }
    });

    render(
      <AccessControl>
        <div data-testid="test-content">Test Content</div>
      </AccessControl>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });
});
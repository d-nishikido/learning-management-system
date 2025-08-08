import React, { Component, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './Card';
import { Button } from './Button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// Error display component that uses hooks
const ErrorDisplay: React.FC<{
  error: Error | null;
  onRetry: () => void;
  onGoHome: () => void;
}> = ({ error, onRetry, onGoHome }) => {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('errorBoundary.title', 'アプリケーションエラーが発生しました')}
            </h2>
            <p className="text-gray-600">
              {t('errorBoundary.message', '申し訳ございませんが、予期しないエラーが発生しました。ページを再読み込みするか、ホームページに戻ってください。')}
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-left">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                {t('errorBoundary.technicalDetails', '技術的な詳細を表示')}
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-700 overflow-auto max-h-32">
                <strong>Error:</strong> {error.message}<br />
                <strong>Stack:</strong> {error.stack}
              </div>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={onRetry}
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {t('errorBoundary.retry', '再試行')}
            </Button>
            <Button 
              onClick={onGoHome}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              {t('errorBoundary.goHome', 'ホームに戻る')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add error reporting service (e.g., Sentry)
      // reportError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorDisplay
          error={this.state.error}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/contexts';

interface LogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  showConfirmation?: boolean;
  className?: string;
}

export function LogoutButton({
  variant = 'outline',
  size = 'md',
  fullWidth = false,
  showConfirmation = true,
  className = '',
}: LogoutButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  const handleLogout = async () => {
    if (showConfirmation && !showDialog) {
      setShowDialog(true);
      return;
    }
    
    setIsLoading(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
      setShowDialog(false);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        onClick={handleLogout}
        isLoading={isLoading}
        className={className}
      >
        {t('logout')}
      </Button>
      
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleCancel}
          />
          
          {/* Modal */}
          <div className="relative z-10 bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-red-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    {t('logoutConfirmation.title')}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {t('logoutConfirmation.message')}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <Button
                  variant="danger"
                  onClick={handleLogout}
                  isLoading={isLoading}
                  className="flex-1"
                  data-testid="logout-confirm-button"
                >
                  {t('logoutConfirmation.confirm')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                  data-testid="logout-cancel-button"
                >
                  {t('logoutConfirmation.cancel')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
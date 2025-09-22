import React, { useState } from 'react';
import { Facebook, Loader2 } from 'lucide-react';
import { FacebookOAuthService } from '../api/oauth';

interface FacebookOAuthButtonProps {
  onSuccess?: (tokens: any) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const FacebookOAuthButton: React.FC<FacebookOAuthButtonProps> = ({
  onSuccess,
  onError,
  className = '',
  variant = 'primary',
  size = 'md'
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleFacebookLogin = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      console.log('Initiating Facebook OAuth flow...');
      
      // Initiate OAuth flow
      FacebookOAuthService.initiateAuth();
      
    } catch (error) {
      console.error('Facebook OAuth error:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Failed to initiate Facebook login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'bg-[#1877F2] hover:bg-[#166FE5] text-white',
    secondary: 'bg-white hover:bg-gray-50 text-[#1877F2] border border-[#1877F2]'
  };

  return (
    <button
      onClick={handleFacebookLogin}
      disabled={isLoading}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
        flex items-center justify-center space-x-3
        rounded-lg font-medium transition-colors
        shadow-sm hover:shadow-md
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:ring-3 focus:ring-blue-500 focus:ring-opacity-50
      `}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Facebook className="w-5 h-5" />
      )}
      <span>
        {isLoading ? 'Connecting...' : 'Login with Facebook'}
      </span>
    </button>
  );
};

export default FacebookOAuthButton;

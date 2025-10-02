import React, { useState, useEffect } from 'react';
import { Linkedin, Loader2 } from 'lucide-react';
import { LinkedInOAuthService } from '../api/oauth';
import { useAuth } from '../Contexts/AuthContext';
import { checkLinkedInConnection } from '../utils/autoConnectSocialAccounts';

interface LinkedInOAuthButtonProps {
  onSuccess?: (tokens: any) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const LinkedInOAuthButton: React.FC<LinkedInOAuthButtonProps> = ({
  onSuccess,
  onError,
  className = '',
  variant = 'primary',
  size = 'md'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { currentUser } = useAuth();

  // Check if LinkedIn is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (currentUser) {
        try {
          const result = await checkLinkedInConnection(currentUser);
          if (result.success) {
            setIsConnected(result.isConnected || false);
          }
        } catch (error) {
          console.warn('Error checking LinkedIn connection:', error);
        }
      }
      setIsChecking(false);
    };

    checkConnection();
  }, [currentUser]);

  const handleLinkedInLogin = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      
      if (isConnected) {
        console.log('LinkedIn is already connected');
        if (onSuccess) {
          onSuccess({ message: 'LinkedIn is already connected' });
        }
        return;
      }
      
      console.log('Initiating LinkedIn OAuth flow...');
      
      // Check if LinkedIn OAuth is configured
      if (!import.meta.env.VITE_LINKEDIN_CLIENT_ID) {
        const errorMsg = 'LinkedIn OAuth is not configured. Please set VITE_LINKEDIN_CLIENT_ID environment variable.';
        console.error(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
        return;
      }
      
      // Initiate OAuth flow (redirects to LinkedIn)
      LinkedInOAuthService.initiateAuth();
      
    } catch (error) {
      console.error('LinkedIn OAuth error:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Failed to initiate LinkedIn login');
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
    primary: 'bg-[#0077B5] hover:bg-[#005885] text-white',
    secondary: 'bg-white hover:bg-gray-50 text-[#0077B5] border border-[#0077B5]'
  };

  if (isChecking) {
    return (
      <button
        disabled
        className={`
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
          flex items-center justify-center space-x-3
          rounded-lg font-medium transition-colors
          shadow-sm opacity-50 cursor-not-allowed
        `}
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Checking...</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleLinkedInLogin}
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
        <Linkedin className="w-5 h-5" />
      )}
      <span>
        {isLoading 
          ? 'Connecting...' 
          : isConnected 
            ? 'LinkedIn Connected' 
            : 'Connect LinkedIn Account'
        }
      </span>
    </button>
  );
};

export default LinkedInOAuthButton;
import React, { useState } from 'react';
import { signInWithFacebook, signInWithGoogle } from '../firebase/auth';
import { Facebook, Chrome, Loader2 } from 'lucide-react';
import { handleSocialSignup } from '../utils/autoConnectSocialAccounts';
import { useNavigate } from 'react-router-dom';

interface SocialLoginButtonsProps {
  onLogin?: (platform: string) => void;
  onError?: (error: string) => void;
  className?: string;
  mode?: 'login' | 'signup';
}

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({ 
  onLogin, 
  onError, 
  className = '',
  mode = 'login'
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);
  const handleFacebookLogin = async () => {
    // Prevent multiple simultaneous requests
    if (isLoading) {
      console.log('Facebook login already in progress, ignoring duplicate request');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingPlatform('facebook');
      console.log('=== SocialLoginButtons - handleFacebookLogin START ===');
      
      if (onLogin) onLogin('facebook');
      const { user, error, accessToken } = await signInWithFacebook();
      
      console.log('SocialLoginButtons - signInWithFacebook result:', { user: !!user, error, accessToken: !!accessToken });
      
      if (error) {
        console.log('SocialLoginButtons - Facebook login error:', error);
        if (onError) onError(error);
        return;
      }
      
      if (user) {
        console.log('Facebook login successful:', user);
        console.log('SocialLoginButtons - User provider data:', user.providerData);
        
        // Auto-connect social accounts for both signup and login
        try {
          console.log('SocialLoginButtons - Starting auto-connect for user:', user.uid);
          console.log('SocialLoginButtons - About to call handleSocialSignup...');
          console.log('SocialLoginButtons - User provider data before auto-connect:', user.providerData);
          
          const autoConnectResult = await handleSocialSignup(user);
          console.log('SocialLoginButtons - handleSocialSignup completed:', autoConnectResult);
          console.log('SocialLoginButtons - Social accounts auto-connected successfully');
        } catch (connectError) {
          console.error('SocialLoginButtons - Auto-connect failed:', connectError);
          console.error('SocialLoginButtons - Error details:', connectError);
          console.error('SocialLoginButtons - Error stack:', connectError);
          // Don't show error to user as they can still use the app
        }
        
        // Navigate to dashboard
        console.log('SocialLoginButtons - Navigating to dashboard...');
        navigate('/dashboard');
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('SocialLoginButtons - Facebook login error:', err);
      if (onError) onError(err.message);
    } finally {
      setIsLoading(false);
      setLoadingPlatform(null);
      console.log('=== SocialLoginButtons - handleFacebookLogin END ===');
    }
  };

  const handleGoogleLogin = async () => {
    // Prevent multiple simultaneous requests
    if (isLoading) {
      console.log('Google login already in progress, ignoring duplicate request');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingPlatform('google');
      
      if (onLogin) onLogin('google');
      const { user, error } = await signInWithGoogle();
      
      if (error) {
        if (onError) onError(error);
      } else if (user) {
        // Google login successful
        console.log('Google login successful:', user);
        
        // Auto-connect social accounts for both signup and login
        try {
          console.log('SocialLoginButtons - Starting auto-connect for Google user:', user.uid);
          await handleSocialSignup(user);
          console.log('SocialLoginButtons - Social accounts auto-connected successfully');
        } catch (connectError) {
          console.error('SocialLoginButtons - Auto-connect failed:', connectError);
        }
        
        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (error: unknown) {
      const err = error as Error;
      if (onError) onError(err.message);
    } finally {
      setIsLoading(false);
      setLoadingPlatform(null);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      {/* Facebook Login Button */}
      <button
        onClick={handleFacebookLogin}
        disabled={isLoading}
        className="btn w-full flex items-center justify-center space-x-3 bg-[#1877F2] hover:bg-[#166FE5] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md border border-transparent focus:ring-3 focus:ring-accent focus:ring-opacity-50"
      >
        {loadingPlatform === 'facebook' ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Facebook className="w-5 h-5" />
        )}
        <span>
          {loadingPlatform === 'facebook' 
            ? 'Signing in...' 
            : mode === 'signup' ? 'Sign up with Facebook' : 'Continue with Facebook'
          }
        </span>
      </button>

      {/* Google Login Button */}
      <button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="btn w-full flex items-center justify-center space-x-3 bg-bg-secondary hover:bg-bg-tertiary disabled:bg-bg-tertiary disabled:cursor-not-allowed text-text px-4 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md border border-border focus:ring-3 focus:ring-accent focus:ring-opacity-50"
      >
        {loadingPlatform === 'google' ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Chrome className="w-5 h-5" />
        )}
        <span>
          {loadingPlatform === 'google' 
            ? 'Signing in...' 
            : mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'
          }
        </span>
      </button>

      <div className="text-center">
        <p className="text-xs text-text-muted">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default SocialLoginButtons;

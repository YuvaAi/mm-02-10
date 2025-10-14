import React, { useState, useEffect } from 'react';
import { FacebookOAuth, LinkedInOAuth, isOAuthConfigured } from '../api/oauth';
import { signInWithFacebook } from '../firebase/auth';
import { Facebook, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { handleSocialSignup } from '../utils/autoConnectSocialAccounts';
import { useAuth } from '../Contexts/AuthContext';
import { getCredentials } from '../firebase/firestore';
import GlassPanel from './GlassPanel';

interface OAuthLoginButtonsProps {
  onConnect?: (platform: string) => void;
  className?: string;
}

const OAuthLoginButtons: React.FC<OAuthLoginButtonsProps> = ({ 
  onConnect, 
  className = '' 
}) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<{
    facebook: boolean;
    linkedin: boolean;
    instagram: boolean;
  }>({
    facebook: false,
    linkedin: false,
    instagram: false
  });
  const [loadingCredentials, setLoadingCredentials] = useState(true);

  // Fetch connected accounts on component mount
  useEffect(() => {
    const fetchConnectedAccounts = async () => {
      if (!currentUser) {
        setLoadingCredentials(false);
        return;
      }

      try {
        const result = await getCredentials(currentUser.uid);
        if (result.success && result.data) {
          const accounts = {
            facebook: result.data.some((cred: any) => cred.type === 'facebook'),
            linkedin: result.data.some((cred: any) => cred.type === 'linkedin'),
            instagram: result.data.some((cred: any) => cred.type === 'instagram')
          };
          setConnectedAccounts(accounts);
        }
      } catch (error) {
        console.error('Error fetching connected accounts:', error);
      } finally {
        setLoadingCredentials(false);
      }
    };

    fetchConnectedAccounts();
  }, [currentUser]);

  // Refresh connected accounts after successful connection
  const refreshConnectedAccounts = async () => {
    if (!currentUser) return;

    try {
      const result = await getCredentials(currentUser.uid);
      if (result.success && result.data) {
        const accounts = {
          facebook: result.data.some((cred: any) => cred.type === 'facebook'),
          linkedin: result.data.some((cred: any) => cred.type === 'linkedin'),
          instagram: result.data.some((cred: any) => cred.type === 'instagram')
        };
        setConnectedAccounts(accounts);
      }
    } catch (error) {
      console.error('Error refreshing connected accounts:', error);
    }
  };

  const handleConnect = (platform: string) => {
    if (onConnect) {
      onConnect(platform);
    }
  };

  const handleFacebookConnect = async () => {
    if (!currentUser) {
      // If user is not logged in, redirect to login page
      window.location.href = '/login';
      return;
    }

    // Prevent multiple simultaneous requests
    if (isLoading) {
      console.log('Facebook connection already in progress, ignoring duplicate request');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingPlatform('facebook');
      console.log('=== OAuthLoginButtons - handleFacebookConnect START ===');
      
      if (onConnect) onConnect('facebook');
      
      // Use Firebase Auth popup for Facebook connection (same as login flow)
      const { user, error, accessToken } = await signInWithFacebook();
      
      console.log('OAuthLoginButtons - signInWithFacebook result:', { user: !!user, error, accessToken: !!accessToken });
      
      if (error) {
        console.log('OAuthLoginButtons - Facebook connection error:', error);
        return;
      }
      
      if (user) {
        console.log('Facebook connection successful:', user);
        
        // Auto-connect social accounts for the current user
        try {
          console.log('OAuthLoginButtons - Starting auto-connect for user:', user.uid);
          const autoConnectResult = await handleSocialSignup(user);
          console.log('OAuthLoginButtons - handleSocialSignup completed:', autoConnectResult);
          console.log('OAuthLoginButtons - Social accounts connected successfully');
          
          // Refresh connected accounts to show updated status
          await refreshConnectedAccounts();
          
          // Show success message or update UI
          alert('Facebook account connected successfully!');
        } catch (connectError) {
          console.error('OAuthLoginButtons - Auto-connect failed:', connectError);
          alert('Facebook account connected but failed to save credentials. Please try again.');
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('OAuthLoginButtons - Facebook connection error:', err);
      alert('Failed to connect Facebook account. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingPlatform(null);
      console.log('=== OAuthLoginButtons - handleFacebookConnect END ===');
    }
  };

  const handleLinkedInConnect = () => {
    if (!currentUser) {
      // If user is not logged in, redirect to login page
      window.location.href = '/login';
      return;
    }
    
    // For LinkedIn, we still use the redirect flow since it doesn't support popup auth
    LinkedInOAuth.initiateAuth();
    handleConnect('linkedin');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connected Accounts Glass Panel */}
      {currentUser && (
        <GlassPanel variant="accent" className="animate-slide-in-left">
          <div className="glass-panel-content">
            <div className="glass-panel-header">
              <h3 className="glass-panel-title text-lg font-semibold mb-3">
                Connected Accounts
              </h3>
            </div>
            
            {loadingCredentials ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                <span className="ml-2 text-sm text-gray-500">Loading...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Facebook Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Facebook className="w-4 h-4 text-[#1877F2]" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Facebook</span>
                  </div>
                  {connectedAccounts.facebook ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-gray-400">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs">Not connected</span>
                    </div>
                  )}
                </div>

                {/* Instagram Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-[#E4405F]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Instagram</span>
                  </div>
                  {connectedAccounts.instagram ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-gray-400">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs">Not connected</span>
                    </div>
                  )}
                </div>

                {/* LinkedIn Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-[#0077B5]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">LinkedIn</span>
                  </div>
                  {connectedAccounts.linkedin ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-gray-400">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs">Not connected</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </GlassPanel>
      )}

      {/* Connect Social Media Accounts Glass Panel */}
      <GlassPanel variant="purple" className="animate-slide-in-left">
        <div className="glass-panel-content">
          <div className="glass-panel-header">
            <h3 className="glass-panel-title text-lg font-semibold mb-2">
              Connect Social Media Accounts
            </h3>
            <p className="glass-panel-subtitle text-sm text-gray-600 dark:text-gray-300 mb-4">
              Connect your social media accounts to extract access tokens with posting permissions
            </p>
          </div>

          <div className="space-y-3">
            {/* Facebook OAuth Button */}
            <button
              onClick={handleFacebookConnect}
              disabled={isLoading || connectedAccounts.facebook}
              className={`w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md border border-transparent focus:ring-3 focus:ring-accent focus:ring-opacity-50 ${
                connectedAccounts.facebook
                  ? 'bg-green-100 text-green-800 cursor-default'
                  : 'bg-[#1877F2] hover:bg-[#166FE5] disabled:bg-gray-400 disabled:cursor-not-allowed text-white'
              }`}
            >
              {loadingPlatform === 'facebook' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : connectedAccounts.facebook ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Facebook className="w-5 h-5" />
              )}
              <span>
                {loadingPlatform === 'facebook' 
                  ? 'Connecting...' 
                  : connectedAccounts.facebook
                  ? 'Facebook Connected'
                  : 'Connect Facebook'
                }
              </span>
            </button>

            {/* LinkedIn OAuth Button */}
            <button
              onClick={handleLinkedInConnect}
              disabled={isLoading || connectedAccounts.linkedin}
              className={`w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md border border-transparent focus:ring-3 focus:ring-accent focus:ring-opacity-50 ${
                connectedAccounts.linkedin
                  ? 'bg-green-100 text-green-800 cursor-default'
                  : 'bg-[#0077B5] hover:bg-[#005885] disabled:bg-gray-400 disabled:cursor-not-allowed text-white'
              }`}
            >
              {connectedAccounts.linkedin ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              )}
              <span>
                {connectedAccounts.linkedin ? 'LinkedIn Connected' : 'Connect LinkedIn'}
              </span>
            </button>

          </div>
        </div>
      </GlassPanel>
    </div>
  );
};

export default OAuthLoginButtons;

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FacebookOAuthService, LinkedInOAuthService } from '../api/oauth';
import { useAuth } from '../Contexts/AuthContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const PopupOAuthCallback: React.FC = () => {
  const { platform } = useParams<{ platform: string }>();
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        if (platform === 'linkedin') {
          // For LinkedIn authorization code flow, check URL search params
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          const state = urlParams.get('state');
          const error = urlParams.get('error');
          const errorDescription = urlParams.get('error_description');

          if (error) {
            setStatus('error');
            setMessage(`LinkedIn authentication failed: ${errorDescription || error}`);
            
            // Send error message to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'LINKEDIN_OAUTH_ERROR',
                error: errorDescription || error
              }, window.location.origin);
            }
            return;
          }

          if (!code || !state) {
            setStatus('error');
            setMessage('Missing LinkedIn authentication parameters. Please try again.');
            
            // Send error message to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'LINKEDIN_OAUTH_ERROR',
                error: 'Missing authentication parameters'
              }, window.location.origin);
            }
            return;
          }

          if (!currentUser) {
            setStatus('error');
            setMessage('User not authenticated. Please login first.');
            
            // Send error message to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'LINKEDIN_OAUTH_ERROR',
                error: 'User not authenticated'
              }, window.location.origin);
            }
            return;
          }

          const result = await LinkedInOAuthService.handleCallback(code, state, currentUser.uid);
          
          if (result.success && result.accessToken) {
            // Store tokens securely for dynamic user
            LinkedInOAuthService.storeTokens({
              accessToken: result.accessToken,
              expiresIn: result.expiresIn || 3600,
              tokenType: 'Bearer',
              scope: 'w_member_social,w_organization_social,r_basicprofile' // Only required permissions
            }, result.userInfo);

            // Store access token in session storage for auto-connect
            sessionStorage.setItem('linkedin_access_token', result.accessToken);

            // Auto-connect LinkedIn account
            const attemptAutoConnect = async (user: any) => {
              try {
                // Import and call the auto-connect function
                const { signInWithLinkedInAndConnect } = await import('../utils/autoConnectSocialAccounts');
                const connectResult = await signInWithLinkedInAndConnect(user, result.accessToken);
                
                if (connectResult.success) {
                  console.log('LinkedIn accounts auto-connected successfully');
                } else {
                  console.warn('LinkedIn auto-connect failed:', connectResult.error);
                }
              } catch (connectError) {
                console.warn('Error during LinkedIn auto-connect:', connectError);
              }
            };

            await attemptAutoConnect(currentUser);

            setStatus('success');
            setMessage('Successfully connected to LinkedIn! All credentials have been saved.');
            
            // Send success message to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'LINKEDIN_OAUTH_SUCCESS',
                result: result
              }, window.location.origin);
            }
          } else {
            setStatus('error');
            setMessage(result.error || 'Authentication failed');
            
            // Send error message to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'LINKEDIN_OAUTH_ERROR',
                error: result.error || 'Authentication failed'
              }, window.location.origin);
            }
          }
        } else {
          setStatus('error');
          setMessage('Unsupported platform');
          
          // Send error message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'LINKEDIN_OAUTH_ERROR',
              error: 'Unsupported platform'
            }, window.location.origin);
          }
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred');
        
        // Send error message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'LINKEDIN_OAUTH_ERROR',
            error: 'An unexpected error occurred'
          }, window.location.origin);
        }
      }
    };

    handleOAuthCallback();
  }, [platform, currentUser]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
          <div className="mb-6">
            {status === 'loading' && (
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            )}
            {status === 'error' && (
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {status === 'loading' && 'Connecting...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Error'}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          
          {status === 'success' && (
            <p className="text-sm text-gray-500">
              You can close this window now.
            </p>
          )}
          
          {status === 'error' && (
            <p className="text-sm text-gray-500">
              You can close this window and try again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopupOAuthCallback;

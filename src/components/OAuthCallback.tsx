import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FacebookOAuthService } from '../api/oauth';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const OAuthCallback: React.FC = () => {
  const { platform } = useParams<{ platform: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // For implicit flow, check URL fragment for access token
        const hash = window.location.hash.substring(1);
        const urlParams = new URLSearchParams(hash);
        const accessToken = urlParams.get('access_token');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          return;
        }

        if (!accessToken || !state) {
          setStatus('error');
          setMessage('Missing authentication parameters');
          return;
        }

        if (platform === 'facebook') {
          const result = await FacebookOAuthService.handleCallback(accessToken, state);
          
          if (result.success && result.accessToken) {
            // Store tokens securely
            FacebookOAuthService.storeTokens({
              accessToken: result.accessToken,
              expiresIn: result.expiresIn || 3600,
              tokenType: 'Bearer',
              scope: 'public_profile,email,pages_manage_posts'
            }, result.userInfo);

            setStatus('success');
            setMessage('Successfully connected to Facebook!');
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } else {
            setStatus('error');
            setMessage(result.error || 'Authentication failed');
          }
        } else {
          setStatus('error');
          setMessage('Unsupported platform');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred');
      }
    };

    handleOAuthCallback();
  }, [platform, navigate]);

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
              Redirecting to dashboard...
            </p>
          )}
          
          {status === 'error' && (
            <button
              onClick={() => navigate('/login')}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;

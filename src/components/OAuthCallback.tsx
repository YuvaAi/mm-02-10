import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';
import { OAuthCallbackHandler } from '../api/oauth';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const OAuthCallback: React.FC = () => {
  const { platform } = useParams<{ platform: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      if (!currentUser) {
        setStatus('error');
        setMessage('User not authenticated. Please log in first.');
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      if (error) {
        setStatus('error');
        setMessage(`OAuth error: ${errorDescription || error}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received from OAuth provider');
        return;
      }

      // Basic state validation
      if (!state) {
        setStatus('error');
        setMessage('Missing state parameter. This may be a security issue.');
        return;
      }

      try {
        let result;
        
        switch (platform) {
          case 'facebook':
            result = await OAuthCallbackHandler.handleFacebookCallback(currentUser.uid, code);
            break;
          case 'linkedin':
            result = await OAuthCallbackHandler.handleLinkedInCallback(currentUser.uid, code);
            break;
          default:
            setStatus('error');
            setMessage(`Unknown platform: ${platform}`);
            return;
        }

        if (result.success) {
          setStatus('success');
          setMessage(`${platform?.charAt(0).toUpperCase()}${platform?.slice(1)} connected successfully!`);
          
          // Redirect to credential vault after 2 seconds
          setTimeout(() => {
            navigate('/credential-vault');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(result.error || 'Failed to connect account');
        }
      } catch (error: unknown) {
        const err = error as Error;
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage(err.message || 'An unexpected error occurred');
      }
    };

    handleCallback();
  }, [currentUser, platform, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-12 h-12 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>
        
        <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {status === 'loading' && 'Connecting...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Connection Failed'}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        {status === 'success' && (
          <p className="text-sm text-gray-500">
            Redirecting to Credential Vault...
          </p>
        )}
        
        {status === 'error' && (
          <button
            onClick={() => navigate('/credential-vault')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Credential Vault
          </button>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;

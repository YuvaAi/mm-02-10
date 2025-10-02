import React from 'react';
import FacebookOAuthButton from './FacebookOAuthButton';
import LinkedInOAuthButton from './LinkedInOAuthButton';
import { isOAuthConfigured, isLinkedInOAuthConfigured } from '../api/oauth';

interface OAuthLoginButtonsProps {
  onConnect?: (platform: string) => void;
  className?: string;
}

const OAuthLoginButtons: React.FC<OAuthLoginButtonsProps> = ({ 
  onConnect, 
  className = '' 
}) => {
  const handleConnect = (platform: string) => {
    if (onConnect) {
      onConnect(platform);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Connect Social Media Accounts
        </h3>
        <p className="text-sm text-gray-600">
          Connect your social media accounts to extract access tokens with posting permissions
        </p>
      </div>

      {/* Facebook OAuth Button */}
      <FacebookOAuthButton
        onSuccess={(tokens) => {
          console.log('Facebook OAuth successful:', tokens);
          handleConnect('facebook');
        }}
        onError={(error) => {
          console.error('Facebook OAuth error:', error);
        }}
        className="w-full"
        variant="primary"
        size="md"
      />

      {/* LinkedIn OAuth Button */}
      <LinkedInOAuthButton
        onSuccess={(tokens) => {
          console.log('LinkedIn OAuth successful:', tokens);
          handleConnect('linkedin');
        }}
        onError={(error) => {
          console.error('LinkedIn OAuth error:', error);
        }}
        className="w-full"
        variant="primary"
        size="md"
      />

      {!isOAuthConfigured() && !isLinkedInOAuthConfigured() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            ⚠️ OAuth is not fully configured. Some features may not work properly.
          </p>
        </div>
      )}

      {!isLinkedInOAuthConfigured() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            ℹ️ LinkedIn OAuth requires VITE_LINKEDIN_CLIENT_ID environment variable.
          </p>
        </div>
      )}
    </div>
  );
};

export default OAuthLoginButtons;

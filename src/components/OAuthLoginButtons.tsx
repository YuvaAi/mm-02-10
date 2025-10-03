import React from 'react';
import { FacebookOAuth, LinkedInOAuth, isOAuthConfigured } from '../api/oauth';

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

  const handleFacebookConnect = () => {
    FacebookOAuth.initiateAuth();
    handleConnect('facebook');
  };

  const handleLinkedInConnect = () => {
    LinkedInOAuth.initiateAuth();
    handleConnect('linkedin');
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
      <button
        onClick={handleFacebookConnect}
        className="w-full flex items-center justify-center space-x-3 bg-[#1877F2] hover:bg-[#166FE5] text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
      >
        <span>Connect Facebook</span>
      </button>

      {/* LinkedIn OAuth Button */}
      <button
        onClick={handleLinkedInConnect}
        className="w-full flex items-center justify-center space-x-3 bg-[#0077B5] hover:bg-[#005885] text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
      >
        <span>Connect LinkedIn</span>
      </button>

      {!isOAuthConfigured() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            ⚠️ OAuth is not fully configured. Some features may not work properly.
          </p>
        </div>
      )}
    </div>
  );
};

export default OAuthLoginButtons;

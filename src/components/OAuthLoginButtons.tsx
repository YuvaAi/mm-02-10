import React from 'react';
import { OAuthService } from '../services/oauthService';
import { Facebook, Linkedin, Instagram, ExternalLink, AlertCircle } from 'lucide-react';

interface OAuthLoginButtonsProps {
  onConnect?: (platform: string) => void;
  className?: string;
}

const OAuthLoginButtons: React.FC<OAuthLoginButtonsProps> = ({ onConnect, className = '' }) => {
  const handleFacebookConnect = () => {
    try {
      if (onConnect) onConnect('facebook');
      OAuthService.initiateSocialMediaConnection('facebook');
    } catch (error) {
      console.error('Facebook OAuth error:', error);
      alert('Facebook OAuth is not properly configured. Please check your environment variables.');
    }
  };

  const handleLinkedInConnect = () => {
    try {
      if (onConnect) onConnect('linkedin');
      OAuthService.initiateSocialMediaConnection('linkedin');
    } catch (error) {
      console.error('LinkedIn OAuth error:', error);
      alert('LinkedIn OAuth is not properly configured. Please check your environment variables.');
    }
  };

  const handleInstagramConnect = () => {
    // Instagram uses Facebook OAuth, so we redirect to Facebook with Instagram scope
    try {
      if (onConnect) onConnect('instagram');
      OAuthService.initiateSocialMediaConnection('facebook');
    } catch (error) {
      console.error('Instagram OAuth error:', error);
      alert('Instagram OAuth is not properly configured. Please check your environment variables.');
    }
  };

  const configuredPlatforms = OAuthService.getConfiguredPlatforms();

  if (configuredPlatforms.length === 0) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">OAuth Not Configured</h3>
            <p className="text-xs text-yellow-700 mt-1">
              Please configure OAuth credentials in your environment variables. See env.example for reference.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Accounts</h3>
        <p className="text-sm text-gray-600">
          Connect your social media accounts with one click using OAuth
        </p>
      </div>

      {/* Facebook Connect */}
      <button
        onClick={handleFacebookConnect}
        className="w-full flex items-center justify-center space-x-3 bg-[#1877F2] hover:bg-[#166FE5] text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
      >
        <Facebook className="w-5 h-5" />
        <span>Connect Facebook Page</span>
      </button>

      {/* Instagram Connect */}
      <button
        onClick={handleInstagramConnect}
        className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
      >
        <Instagram className="w-5 h-5" />
        <span>Connect Instagram Business</span>
      </button>

      {/* LinkedIn Connect */}
      <button
        onClick={handleLinkedInConnect}
        className="w-full flex items-center justify-center space-x-3 bg-[#0077B5] hover:bg-[#005885] text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
      >
        <Linkedin className="w-5 h-5" />
        <span>Connect LinkedIn Profile</span>
      </button>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          By connecting, you authorize our app to access your social media accounts for content publishing and analytics.
        </p>
      </div>
    </div>
  );
};

export default OAuthLoginButtons;

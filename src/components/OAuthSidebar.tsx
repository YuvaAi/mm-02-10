import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Contexts/AuthContext';
import { validateFacebookCredentials, getFacebookPages, getFacebookAccessToken } from '../api/facebook';
import { saveCredential, getCredentials } from '../firebase/firestore';
import { handleSocialSignup } from '../utils/autoConnectSocialAccounts';
import { CheckCircle, AlertCircle, Zap, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { UserCredentials } from '../firebase/types';
import GlassPanel from './GlassPanel';
import { OAuthTokenService, isOAuthAvailable } from '../services/oauthTokenService';
import { isOAuthConfigured } from '../api/oauth';
import OAuthLoginButtons from './OAuthLoginButtons';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

const OAuthSidebar: React.FC = () => {
  const { currentUser } = useAuth();
  const [facebookOAuthData, setFacebookOAuthData] = useState<any>(null);
  const [facebookAdsData, setFacebookAdsData] = useState<any>(null);
  const [instagramOAuthData, setInstagramOAuthData] = useState<any>(null);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);

  const loadSavedCredentials = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      console.log('Loading saved credentials for user:', currentUser.uid);
      const result = await getCredentials(currentUser.uid);
      const credentials = result.data || [];
      console.log('Loaded credentials:', credentials);
      
      // Set OAuth extracted data for display
      const facebookCred = credentials.find(cred => cred.type === 'facebook');
      const adsCred = credentials.find(cred => cred.type === 'facebook_ads');
      const instagramCred = credentials.find(cred => cred.type === 'instagram');
      
      setFacebookOAuthData(facebookCred);
      setFacebookAdsData(adsCred);
      setInstagramOAuthData(instagramCred);
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadSavedCredentials();
    }
  }, [currentUser, loadSavedCredentials]);

  const handleManualAutoConnect = async () => {
    if (!currentUser) return;
    
    setIsAutoConnecting(true);
    try {
      console.log('Manually triggering auto-connect...');
      await handleSocialSignup(currentUser);
      
      // Reload credentials after auto-connect
      await loadSavedCredentials();
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Manual auto-connect failed:', err);
    } finally {
      setIsAutoConnecting(false);
    }
  };

  return (
    <div className="w-full max-w-[300px] space-y-4">
      {/* OAuth Connection Status */}
      {isOAuthConfigured() && (
        <GlassPanel variant="accent" className="animate-slide-in-left">
          <div className="glass-panel-content">
            <div className="glass-panel-header">
              <div className="flex items-center mb-2">
                <LinkIcon className="w-4 h-4 text-primary mr-2 icon-glow" />
                <h3 className="glass-panel-title text-base font-semibold">OAuth Status</h3>
              </div>
            </div>
            
            <div className="space-y-2">
              {/* Facebook OAuth Status */}
              <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#1877F2] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">f</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-xs">Facebook</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {isOAuthAvailable() ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isOAuthAvailable() ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-yellow-500" />
                  )}
                </div>
              </div>

              {/* OAuth Info */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-1.5 shadow-sm">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  <strong>Status:</strong> {isOAuthAvailable() 
                    ? 'Connected via OAuth' 
                    : 'Not connected'
                  }
                </p>
              </div>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* Connect Social Media Accounts */}
      <GlassPanel variant="purple" className="animate-slide-in-left aspect-square">
        <div className="glass-panel-content">
          <div>
            <OAuthLoginButtons 
              onConnect={(platform) => {
                console.log(`Initiating OAuth for ${platform}`);
              }}
              className="max-w-full"
            />
          </div>
          
          {/* Manual Auto-Connect Button */}
          {currentUser?.providerData.some(provider => 
            provider.providerId === 'facebook.com' || provider.providerId === 'google.com'
          ) && (
            <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
              <p className="text-xs text-text-secondary mb-1">
                Already logged in with social media?
              </p>
              <button
                onClick={handleManualAutoConnect}
                disabled={isAutoConnecting}
                className="w-full bg-primary text-white px-2 py-1.5 rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs transition-all duration-250"
              >
                {isAutoConnecting ? (
                  <div className="flex items-center justify-center space-x-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Connecting...</span>
                  </div>
                ) : (
                  'Auto-Connect'
                )}
              </button>
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
};

export default OAuthSidebar;

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';
import { validateFacebookCredentials, getFacebookPages } from '../api/facebook';
import { saveCredential, getCredentials } from '../firebase/firestore';
import { handleSocialSignup } from '../utils/autoConnectSocialAccounts';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Zap, RefreshCw } from 'lucide-react';
import { UserCredentials } from '../firebase/types';
import OAuthLoginButtons from './OAuthLoginButtons';
import { isOAuthConfigured } from '../api/oauth';
import CredentialDebugger from './CredentialDebugger';
import GlassPanel from './GlassPanel';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

const CredentialVault: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [validationMessage, setValidationMessage] = useState('');
  const [availablePages, setAvailablePages] = useState<FacebookPage[]>([]);
  const [, setSavedCredentials] = useState<UserCredentials[]>([]);
  
  // Instagram state
  const [instagramAccessToken, setInstagramAccessToken] = useState('');
  const [instagramUserId, setInstagramUserId] = useState('');
  const [isValidatingInstagram, setIsValidatingInstagram] = useState(false);
  const [isSavingInstagram, setIsSavingInstagram] = useState(false);
  const [instagramValidationStatus, setInstagramValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [instagramValidationMessage, setInstagramValidationMessage] = useState('');

  // LinkedIn state
  const [linkedInAccessToken, setLinkedInAccessToken] = useState('');
  const [linkedInUserId, setLinkedInUserId] = useState('');
  const [isValidatingLinkedIn, setIsValidatingLinkedIn] = useState(false);
  const [isSavingLinkedIn, setIsSavingLinkedIn] = useState(false);
  const [linkedInValidationStatus, setLinkedInValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [linkedInValidationMessage, setLinkedInValidationMessage] = useState('');

  // Facebook Ads state
  const [adsAccessToken, setAdsAccessToken] = useState('');
  const [adsAccountId, setAdsAccountId] = useState('');
  const [adsCampaignId, setAdsCampaignId] = useState('');
  const [isSavingAds, setIsSavingAds] = useState(false);
  const [adsMessage, setAdsMessage] = useState('');
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);

  const loadSavedCredentials = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      console.log('Loading saved credentials for user:', currentUser.uid);
      const result = await getCredentials(currentUser.uid);
      const credentials = result.data || [];
      console.log('Loaded credentials:', credentials);
      setSavedCredentials(credentials);
      
      // Auto-load Facebook credentials if they exist
      const facebookCred = credentials.find(cred => cred.type === 'facebook');
      if (facebookCred) {
        setAccessToken(facebookCred.accessToken || '');
        setPageId(facebookCred.pageId || '');
        setExpiryDate(facebookCred.expiryDate || '');
      }
      
      // Auto-load Instagram credentials if they exist
      const instagramCred = credentials.find(cred => cred.type === 'instagram');
      if (instagramCred) {
        setInstagramAccessToken(instagramCred.accessToken || '');
        setInstagramUserId(instagramCred.instagramUserId || '');
      }
      
      // Auto-load LinkedIn credentials if they exist
      const linkedInCred = credentials.find(cred => cred.type === 'linkedin');
      if (linkedInCred) {
        setLinkedInAccessToken(linkedInCred.accessToken || '');
        setLinkedInUserId(linkedInCred.linkedInUserId || '');
      }

      // Auto-load Facebook Ads credentials if they exist
      const adsCred = credentials.find(cred => cred.type === 'facebook_ads');
      if (adsCred) {
        setAdsAccessToken((adsCred as any).accessToken || '');
        setAdsAccountId((adsCred as any).adAccountId || '');
        setAdsCampaignId((adsCred as any).campaignId || '');
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadSavedCredentials();
    }
  }, [currentUser, loadSavedCredentials]);

  const validateCredentials = async () => {
    if (!accessToken.trim()) {
      setValidationStatus('invalid');
      setValidationMessage('Please enter a Facebook Access Token');
      return;
    }

    setIsValidating(true);
    setValidationStatus('idle');
    setValidationMessage('');

    try {
      const validation = await validateFacebookCredentials(accessToken, pageId || '');
      
      if (validation.isValid) {
        setValidationStatus('valid');
        setValidationMessage('✅ Valid credentials! All required permissions found.');
        
        // Load available pages
        const pages = await getFacebookPages(accessToken);
        setAvailablePages(pages);
        
        if (pages.length > 0 && !pageId) {
          setPageId(pages[0].id);
        }
      } else {
        setValidationStatus('invalid');
        setValidationMessage(`❌ ${validation.error}`);
        setAvailablePages([]);
      }
    } catch (error) {
      setValidationStatus('invalid');
      setValidationMessage(`❌ Error validating credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAvailablePages([]);
    } finally {
      setIsValidating(false);
    }
  };

  const handleManualAutoConnect = async () => {
    if (!currentUser) return;
    
    setIsAutoConnecting(true);
    try {
      console.log('Manually triggering auto-connect...');
      await handleSocialSignup(currentUser);
      
      // Reload credentials after auto-connect
      await loadSavedCredentials();
      
      setValidationMessage('Social accounts auto-connected successfully!');
      setValidationStatus('valid');
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Manual auto-connect failed:', err);
      setValidationMessage(`Auto-connect failed: ${err.message}`);
      setValidationStatus('invalid');
    } finally {
      setIsAutoConnecting(false);
    }
  };

  const saveCredentials = async () => {
    if (!currentUser) return;
    
    if (!accessToken.trim() || !pageId.trim()) {
      setValidationMessage('❌ Please enter both Access Token and Page ID');
      return;
    }

    setIsSaving(true);

    try {
      const credentialData = {
        type: 'facebook',
        accessToken: accessToken.trim(),
        pageId: pageId.trim(),
        expiryDate: expiryDate || '',
        createdAt: new Date().toISOString(),
        lastValidated: new Date().toISOString()
      };
      const result = await saveCredential(currentUser.uid, credentialData);
      if (result.success) {
        setValidationStatus('valid');
        setValidationMessage('✅ Credentials saved successfully!');
        await loadSavedCredentials();
      } else {
        setValidationStatus('invalid');
        setValidationMessage(`❌ Failed to save credentials: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setValidationMessage(`❌ Error saving credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const validateInstagramCredentials = async () => {
    if (!instagramAccessToken.trim()) {
      setInstagramValidationStatus('invalid');
      setInstagramValidationMessage('Please enter an Instagram Access Token');
      return;
    }

    if (!instagramUserId.trim()) {
      setInstagramValidationStatus('invalid');
      setInstagramValidationMessage('Please enter an Instagram Business Account ID');
      return;
    }

    setIsValidatingInstagram(true);
    setInstagramValidationStatus('idle');
    setInstagramValidationMessage('');

    try {
      const { validateInstagramCredentials } = await import('../api/instagram');
      const validation = await validateInstagramCredentials(instagramAccessToken, instagramUserId);
      
      if (validation.success) {
        setInstagramValidationStatus('valid');
        setInstagramValidationMessage(`✅ Valid Instagram credentials! Account: @${validation.username || 'Unknown'}`);
      } else {
        setInstagramValidationStatus('invalid');
        if (validation.missingPermissions && validation.missingPermissions.length > 0) {
          setInstagramValidationMessage(
            `❌ Missing required permissions: ${validation.missingPermissions.join(', ')}. Please re-authorize your Facebook App with these permissions.`
          );
        } else {
          setInstagramValidationMessage(`❌ ${validation.error || 'Invalid Instagram credentials'}`);
        }
      }
    } catch (error) {
      setInstagramValidationStatus('invalid');
      setInstagramValidationMessage(`❌ Error validating Instagram credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsValidatingInstagram(false);
    }
  };

  const saveInstagramCredentials = async () => {
    if (!currentUser) return;
    
    if (!instagramAccessToken.trim() || !instagramUserId.trim()) {
      setInstagramValidationMessage('❌ Please enter both Instagram Access Token and Business Account ID');
      return;
    }

    setIsSavingInstagram(true);

    try {
      const credentialData = {
        type: 'instagram',
        accessToken: instagramAccessToken.trim(),
        instagramUserId: instagramUserId.trim(),
        createdAt: new Date().toISOString(),
        lastValidated: new Date().toISOString()
      };
      const result = await saveCredential(currentUser.uid, credentialData);
      if (result.success) {
        setInstagramValidationStatus('valid');
        setInstagramValidationMessage('✅ Instagram credentials saved successfully!');
        await loadSavedCredentials();
      } else {
        setInstagramValidationStatus('invalid');
        setInstagramValidationMessage(`❌ Failed to save Instagram credentials: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setInstagramValidationMessage(`❌ Error saving Instagram credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSavingInstagram(false);
    }
  };

  const validateLinkedInCredentials = async () => {
    if (!linkedInAccessToken.trim()) {
      setLinkedInValidationStatus('invalid');
      setLinkedInValidationMessage('Please enter a LinkedIn Access Token');
      return;
    }

    if (!linkedInUserId.trim()) {
      setLinkedInValidationStatus('invalid');
      setLinkedInValidationMessage('Please enter a LinkedIn User ID');
      return;
    }

    setIsValidatingLinkedIn(true);
    setLinkedInValidationStatus('idle');
    setLinkedInValidationMessage('');

    try {
      // Test LinkedIn API access
      const response = await fetch(`https://api.linkedin.com/v2/people/(id:${linkedInUserId})?projection=(id,firstName,lastName)`, {
        headers: {
          'Authorization': `Bearer ${linkedInAccessToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok && data.id) {
        setLinkedInValidationStatus('valid');
        setLinkedInValidationMessage(`✅ Valid LinkedIn credentials! User: ${data.firstName?.localized?.en_US || 'Unknown'} ${data.lastName?.localized?.en_US || ''}`);
      } else {
        setLinkedInValidationStatus('invalid');
        setLinkedInValidationMessage(`❌ ${data.message || data.error_description || 'Invalid LinkedIn credentials'}`);
      }
    } catch (error) {
      setLinkedInValidationStatus('invalid');
      setLinkedInValidationMessage(`❌ Error validating LinkedIn credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsValidatingLinkedIn(false);
    }
  };

  const saveLinkedInCredentials = async () => {
    if (!currentUser) return;
    
    if (!linkedInAccessToken.trim() || !linkedInUserId.trim()) {
      setLinkedInValidationMessage('❌ Please enter both LinkedIn Access Token and User ID');
      return;
    }

    setIsSavingLinkedIn(true);

    try {
      const credentialData = {
        type: 'linkedin',
        accessToken: linkedInAccessToken.trim(),
        linkedInUserId: linkedInUserId.trim(),
        createdAt: new Date().toISOString(),
        lastValidated: new Date().toISOString()
      };
      const result = await saveCredential(currentUser.uid, credentialData);
      if (result.success) {
        setLinkedInValidationStatus('valid');
        setLinkedInValidationMessage('✅ LinkedIn credentials saved successfully!');
        await loadSavedCredentials();
      } else {
        setLinkedInValidationStatus('invalid');
        setLinkedInValidationMessage(`❌ Failed to save LinkedIn credentials: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setLinkedInValidationMessage(`❌ Error saving LinkedIn credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSavingLinkedIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-main animate-gradient p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-bg-alt rounded-2xl shadow-md shadow-purple border border-border-purple p-8 hover:shadow-purple-strong transition-all duration-250 animate-slide-in-top">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-text-secondary hover:text-text transition-all duration-250 mr-6 hover:bg-bg-secondary px-3 py-2 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Key className="w-8 h-8 text-primary mr-3 icon-glow" />
              <h1 className="text-3xl font-bold text-text text-glow">Credential Vault</h1>
            </div>
            <button
              onClick={loadSavedCredentials}
              className="flex items-center space-x-2 bg-gradient-button text-primary-contrast px-4 py-2 rounded-lg hover:bg-gradient-reverse transition-all duration-250 shadow-purple hover:shadow-purple-strong"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Debug Section */}
          <div className="mb-8">
            <CredentialDebugger />
          </div>

          {/* OAuth Quick Connect Section */}
          {isOAuthConfigured() && (
            <GlassPanel variant="purple" className="animate-slide-in-left">
              <div className="glass-panel-content">
                <div className="glass-panel-header">
                  <div className="flex items-center mb-4">
                    <Zap className="w-6 h-6 text-primary mr-2 icon-glow" />
                    <h2 className="glass-panel-title text-xl font-semibold">Connect Social Media Accounts</h2>
                  </div>
                </div>
              <div className="mb-4">
                <p className="text-text-secondary text-sm mb-2">
                  Connect your social media accounts for content publishing and analytics. This is separate from your app login.
                </p>
                <div className="bg-bg border border-info rounded-lg p-3 shadow-info">
                  <p className="text-xs text-info">
                    <strong>Note:</strong> You'll be redirected to the social media platform to authorize access. 
                    After authorization, you'll be redirected back to this app automatically.
                  </p>
                </div>
              </div>
              <OAuthLoginButtons 
                onConnect={(platform) => {
                  console.log(`Initiating OAuth for ${platform}`);
                }}
                className="max-w-md"
              />
              
              {/* Manual Auto-Connect Button */}
              {currentUser?.providerData.some(provider => 
                provider.providerId === 'facebook.com' || provider.providerId === 'google.com'
              ) && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-text-secondary mb-3">
                    Already logged in with social media? Click below to auto-connect your accounts:
                  </p>
                  <button
                    onClick={handleManualAutoConnect}
                    disabled={isAutoConnecting}
                    className="w-full bg-gradient-accent text-primary-contrast px-4 py-2 rounded-lg hover:bg-gradient-reverse disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-violet hover:shadow-violet-strong transition-all duration-250"
                  >
                    {isAutoConnecting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Auto-Connecting...</span>
                      </div>
                    ) : (
                      'Auto-Connect Social Accounts'
                    )}
                  </button>
                </div>
              )}
              </div>
            </GlassPanel>
          )}

          {/* Manual Credential Entry Section */}
          <div className="mb-6 animate-slide-in-right">
            <h2 className="text-xl font-semibold text-text mb-2 text-glow">Manual Credential Entry</h2>
            <p className="text-text-secondary text-sm">
              Alternatively, you can manually enter your access tokens and credentials below.
            </p>
          </div>

          {/* All Credentials in Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Facebook Credentials */}
            <GlassPanel variant="default" className="animate-slide-in-left">
              <div className="glass-panel-content">
                <div className="glass-panel-header">
                  <h2 className="glass-panel-title text-xl font-semibold flex items-center">
                    <div className="w-6 h-6 bg-gradient-button rounded mr-3 shadow-purple"></div>
                    Facebook Page
                  </h2>
                  <p className="glass-panel-subtitle">Connect your Facebook page for content publishing</p>
                </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Access Token *
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="Enter Facebook Access Token"
                      className="w-full px-3 py-2 bg-bg-alt border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-10 text-sm text-text placeholder-text-muted"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page ID *
                  </label>
                  {availablePages.length > 0 ? (
                    <select
                      value={pageId}
                      onChange={(e) => setPageId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      aria-label="Select Facebook page"
                    >
                      {availablePages.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.name} ({page.id})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={pageId}
                      onChange={(e) => setPageId(e.target.value)}
                      placeholder="Enter Facebook Page ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  )}
                </div>

                {/* Validation Status */}
                {validationMessage && (
                  <div className={`p-3 rounded-lg flex items-center text-sm ${
                    validationStatus === 'valid' 
                      ? 'bg-bg-alt text-success border border-success shadow-success' 
                      : 'bg-bg-alt text-error border border-error shadow-error'
                  }`}>
                    {validationStatus === 'valid' ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2" />
                    )}
                    <span>{validationMessage}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={validateCredentials}
                    disabled={isValidating || !accessToken.trim()}
                    className="flex-1 bg-gradient-button text-primary-contrast py-2 px-4 rounded-lg hover:bg-gradient-reverse disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-250 font-medium text-sm shadow-purple hover:shadow-purple-strong"
                  >
                    {isValidating ? 'Validating...' : 'Validate'}
                  </button>
                  
                  <button
                    onClick={saveCredentials}
                    disabled={isSaving || !accessToken.trim() || !pageId.trim()}
                    className="flex-1 bg-gradient-accent text-primary-contrast py-2 px-4 rounded-lg hover:bg-gradient-reverse disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-250 font-medium text-sm shadow-violet hover:shadow-violet-strong"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
            </GlassPanel>

            {/* Instagram Credentials */}
            <GlassPanel variant="purple" className="animate-slide-in-right">
              <div className="glass-panel-content">
                <div className="glass-panel-header">
                  <h2 className="glass-panel-title text-xl font-semibold flex items-center">
                    <div className="w-6 h-6 bg-gradient-accent rounded mr-3 shadow-violet"></div>
                    Instagram Business
                  </h2>
                  <p className="glass-panel-subtitle">Connect your Instagram business account</p>
                </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Token *
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={instagramAccessToken}
                      onChange={(e) => setInstagramAccessToken(e.target.value)}
                      placeholder="Enter Instagram Access Token"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Account ID *
                  </label>
                  <input
                    type="text"
                    value={instagramUserId}
                    onChange={(e) => setInstagramUserId(e.target.value)}
                    placeholder="Enter Instagram Business Account ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Instagram Validation Status */}
                {instagramValidationMessage && (
                  <div className={`p-3 rounded-lg flex items-center text-sm ${
                    instagramValidationStatus === 'valid' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {instagramValidationStatus === 'valid' ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2" />
                    )}
                    <span>{instagramValidationMessage}</span>
                  </div>
                )}

                {/* Instagram Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={validateInstagramCredentials}
                    disabled={isValidatingInstagram || !instagramAccessToken.trim()}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    {isValidatingInstagram ? 'Validating...' : 'Validate'}
                  </button>
                  
                  <button
                    onClick={saveInstagramCredentials}
                    disabled={isSavingInstagram || !instagramAccessToken.trim() || !instagramUserId.trim()}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    {isSavingInstagram ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
            </GlassPanel>
          </div>

          {/* LinkedIn Credentials */}
          <GlassPanel variant="default" className="animate-slide-in-left">
            <div className="glass-panel-content">
              <div className="glass-panel-header">
                <h2 className="glass-panel-title text-xl font-semibold flex items-center">
                  <div className="w-6 h-6 bg-gradient-button rounded mr-3 shadow-purple"></div>
                  LinkedIn Profile
                </h2>
                <p className="glass-panel-subtitle">Connect your LinkedIn profile for professional content</p>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Token *
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={linkedInAccessToken}
                      onChange={(e) => setLinkedInAccessToken(e.target.value)}
                      placeholder="Enter LinkedIn Access Token"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User ID *
                  </label>
                  <input
                    type="text"
                    value={linkedInUserId}
                    onChange={(e) => setLinkedInUserId(e.target.value)}
                    placeholder="Enter LinkedIn User ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* LinkedIn Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={validateLinkedInCredentials}
                    disabled={isValidatingLinkedIn || !linkedInAccessToken.trim()}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    {isValidatingLinkedIn ? 'Validating...' : 'Validate'}
                  </button>
                  
                  <button
                    onClick={saveLinkedInCredentials}
                    disabled={isSavingLinkedIn || !linkedInAccessToken.trim() || !linkedInUserId.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    {isSavingLinkedIn ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {/* LinkedIn Validation Status */}
                {linkedInValidationMessage && (
                  <div className={`p-3 rounded-lg flex items-center text-sm ${
                    linkedInValidationStatus === 'valid' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {linkedInValidationStatus === 'valid' ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2" />
                    )}
                    <span>{linkedInValidationMessage}</span>
                  </div>
                )}
              </div>
            </div>
            </div>
          </GlassPanel>

          {/* Facebook Ads Credentials */}
          <div className="bg-red-50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-pink-600 rounded mr-3"></div>
              Facebook Ads
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Access Token *</label>
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={adsAccessToken}
                    onChange={(e) => setAdsAccessToken(e.target.value)}
                    placeholder="Enter Ads Access Token"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ad Account ID *</label>
                  <input
                    type="text"
                    value={adsAccountId}
                    onChange={(e) => setAdsAccountId(e.target.value)}
                    placeholder="Enter Ad Account ID (act_XXXXXXXXX)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Campaign ID (optional)</label>
                  <input
                    type="text"
                    value={adsCampaignId}
                    onChange={(e) => setAdsCampaignId(e.target.value)}
                    placeholder="Enter Campaign ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  />
                </div>

                {adsMessage && (
                  <div className="p-3 rounded-lg text-sm border bg-white">
                    <span className="text-gray-800">{adsMessage}</span>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={async () => {
                      if (!currentUser) return;
                      if (!adsAccessToken.trim() || !adsAccountId.trim()) {
                        setAdsMessage('❌ Please enter Access Token and Ad Account ID');
                        return;
                      }
                      setIsSavingAds(true);
                      setAdsMessage('');
                      try {
                        const payload = {
                          type: 'facebook_ads',
                          accessToken: adsAccessToken.trim(),
                          adAccountId: adsAccountId.trim(),
                          campaignId: adsCampaignId.trim() || undefined,
                          createdAt: new Date().toISOString(),
                          lastValidated: new Date().toISOString(),
                        } as any;
                        const result = await saveCredential(currentUser.uid, payload);
                        if (result.success) {
                          setAdsMessage('✅ Facebook Ads credentials saved!');
                          await loadSavedCredentials();
                        } else {
                          setAdsMessage(`❌ Failed to save: ${result.error || 'Unknown error'}`);
                        }
                      } catch (e) {
                        const err = e as Error;
                        setAdsMessage(`❌ Error: ${err.message}`);
                      } finally {
                        setIsSavingAds(false);
                      }
                    }}
                    disabled={isSavingAds}
                    className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingAds ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Required Permissions - Organized by Platform */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Facebook Permissions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Facebook Permissions</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">pages_show_list</code>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">pages_read_engagement</code>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">pages_manage_posts</code>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">pages_manage_engagement</code>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">ads_management</code>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">ads_read</code>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">business_management</code>
                </li>
              </ul>
              <p className="text-xs text-blue-600 mt-3">
                💡 <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800">Graph API Explorer</a>
              </p>
            </div>

            {/* Instagram Permissions */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-purple-800 mb-3">Instagram Permissions</h3>
              <ul className="space-y-2 text-sm text-purple-700">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  <code className="bg-purple-100 px-2 py-1 rounded text-xs">instagram_basic</code>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  <code className="bg-purple-100 px-2 py-1 rounded text-xs">instagram_content_publish</code>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  <code className="bg-purple-100 px-2 py-1 rounded text-xs">instagram_manage_insights</code>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  <code className="bg-purple-100 px-2 py-1 rounded text-xs">instagram_manage_comments</code>
                </li>
              </ul>
              <p className="text-xs text-purple-600 mt-3">
                💡 <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-800">Graph API Explorer</a>
              </p>
            </div>

            {/* LinkedIn Permissions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">LinkedIn Permissions</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">r_liteprofile</code>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">w_member_social</code>
                </li>
              </ul>
              <p className="text-xs text-blue-600 mt-3">
                💡 <a href="https://www.linkedin.com/developers/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800">LinkedIn Developer Portal</a>
              </p>
            </div>
          </div>

          {/* Facebook Ads Permissions */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-3">Facebook Ads Permissions</h3>
            <ul className="space-y-2 text-sm text-red-700">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                <code className="bg-red-100 px-2 py-1 rounded">ads_management</code> - To create and manage ads
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                <code className="bg-red-100 px-2 py-1 rounded">ads_read</code> - To read ad performance data
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                <code className="bg-red-100 px-2 py-1 rounded">pages_show_list</code> - To access connected pages
              </li>
            </ul>
            <p className="text-sm text-red-600 mt-4">
              💡 Get your Ad Account ID from <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-800">Facebook Business Manager</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredentialVault;
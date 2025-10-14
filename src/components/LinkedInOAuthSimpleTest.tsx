import React, { useState } from 'react';

const LinkedInOAuthSimpleTest: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const testLinkedInOAuth = () => {
    console.log('=== LinkedIn OAuth Debug ===');
    
    // Get environment variables
    const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_LINKEDIN_CLIENT_SECRET;
    const appUrl = import.meta.env.VITE_APP_URL;
    const currentOrigin = window.location.origin;
    
    console.log('Environment Variables:');
    console.log('- VITE_LINKEDIN_CLIENT_ID:', clientId);
    console.log('- VITE_LINKEDIN_CLIENT_SECRET:', clientSecret ? 'SET' : 'NOT SET');
    console.log('- VITE_APP_URL:', appUrl);
    console.log('- Current Origin:', currentOrigin);
    
    // Construct redirect URI
    const redirectUri = `${currentOrigin}/oauth/linkedin/callback`;
    console.log('- Redirect URI:', redirectUri);
    
    // Construct OAuth URL
    const scope = 'r_liteprofile,r_emailaddress,w_member_social,w_organization_social';
    const state = 'test-state-' + Math.random().toString(36).substring(7);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: state,
      scope: scope
    });
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    
    console.log('Generated OAuth URL:', authUrl);
    console.log('URL Parameters:', Object.fromEntries(params));
    
    // Test URL validity
    let urlValid = false;
    let urlError = null;
    try {
      new URL(authUrl);
      urlValid = true;
      console.log('✅ URL is valid');
    } catch (error: any) {
      urlValid = false;
      urlError = error.message;
      console.error('❌ Invalid URL:', error);
    }
    
    const result = {
      environment: {
        clientId,
        clientSecret: clientSecret ? 'SET' : 'NOT SET',
        appUrl,
        currentOrigin,
        redirectUri
      },
      oauth: {
        scope,
        state,
        params: Object.fromEntries(params),
        authUrl
      },
      validation: {
        urlValid,
        urlError,
        clientIdValid: !!clientId && clientId.length > 0,
        clientSecretValid: !!clientSecret,
        redirectUriValid: redirectUri.includes('/oauth/linkedin/callback')
      }
    };
    
    setDebugInfo(result);
    console.log('Debug Result:', result);
    
    return result;
  };

  const openLinkedInOAuth = () => {
    if (debugInfo?.oauth?.authUrl) {
      console.log('Opening LinkedIn OAuth URL:', debugInfo.oauth.authUrl);
      window.open(debugInfo.oauth.authUrl, '_blank');
    }
  };

  const copyUrl = () => {
    if (debugInfo?.oauth?.authUrl) {
      navigator.clipboard.writeText(debugInfo.oauth.authUrl);
      console.log('URL copied to clipboard');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">LinkedIn OAuth Simple Test</h2>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={testLinkedInOAuth}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Test LinkedIn OAuth Configuration
          </button>
          
          {debugInfo && (
            <div className="flex space-x-4">
              <button
                onClick={openLinkedInOAuth}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Open LinkedIn OAuth URL
              </button>
              <button
                onClick={copyUrl}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Copy URL
              </button>
            </div>
          )}
        </div>

        {debugInfo && (
          <div className="space-y-6">
            {/* Environment Variables */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Environment Variables</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client ID</label>
                  <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                    {debugInfo.environment.clientId || 'NOT SET'}
                  </code>
                  <span className={`ml-2 ${debugInfo.validation.clientIdValid ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo.validation.clientIdValid ? '✅' : '❌'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client Secret</label>
                  <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                    {debugInfo.environment.clientSecret}
                  </code>
                  <span className={`ml-2 ${debugInfo.validation.clientSecretValid ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo.validation.clientSecretValid ? '✅' : '❌'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Redirect URI</label>
                  <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                    {debugInfo.environment.redirectUri}
                  </code>
                  <span className={`ml-2 ${debugInfo.validation.redirectUriValid ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo.validation.redirectUriValid ? '✅' : '❌'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Origin</label>
                  <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                    {debugInfo.environment.currentOrigin}
                  </code>
                </div>
              </div>
            </div>

            {/* OAuth URL */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Generated OAuth URL</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full OAuth URL</label>
                  <div className="flex items-center space-x-2">
                    <code className="bg-white px-3 py-2 rounded border text-sm flex-1 break-all">
                      {debugInfo.oauth.authUrl}
                    </code>
                    <button
                      onClick={copyUrl}
                      className="p-2 text-gray-600 hover:text-gray-800"
                      title="Copy URL"
                    >
                      📋
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Parameters</label>
                  <div className="bg-white rounded border p-3">
                    {Object.entries(debugInfo.oauth.params).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1">
                        <span className="font-medium text-gray-700">{key}:</span>
                        <span className="text-gray-600">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Results */}
            <div className={`rounded-lg p-4 ${
              debugInfo.validation.urlValid ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <h3 className="text-lg font-semibold mb-2">
                {debugInfo.validation.urlValid ? '✅ URL is Valid' : '❌ URL is Invalid'}
              </h3>
              {debugInfo.validation.urlError && (
                <p className="text-red-600">{debugInfo.validation.urlError}</p>
              )}
            </div>

            {/* Troubleshooting */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Troubleshooting Steps</h3>
              <ol className="list-decimal list-inside space-y-2 text-yellow-700">
                <li>Check if your LinkedIn app is configured with the correct redirect URI</li>
                <li>Verify that your LinkedIn app is in "Live" mode (not development)</li>
                <li>Ensure your LinkedIn app has the required scopes</li>
                <li>Test the OAuth URL by clicking "Open LinkedIn OAuth URL"</li>
                <li>Check the browser console for any additional error messages</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedInOAuthSimpleTest;

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, ExternalLink, Copy } from 'lucide-react';

const LinkedInOAuthTest: React.FC = () => {
  const [testResult, setTestResult] = useState<any>(null);

  const runTest = () => {
    const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
    const redirectUri = `${window.location.origin}/oauth/linkedin/callback`;
    const scope = 'r_liteprofile,r_emailaddress,w_member_social,w_organization_social';
    
    const result = {
      environment: {
        clientId: clientId,
        clientSecret: import.meta.env.VITE_LINKEDIN_CLIENT_SECRET ? 'SET' : 'NOT SET',
        redirectUri: redirectUri,
        scope: scope,
        origin: window.location.origin
      },
      validation: {
        clientIdValid: !!clientId && clientId.length > 0,
        clientSecretValid: !!import.meta.env.VITE_LINKEDIN_CLIENT_SECRET,
        redirectUriValid: redirectUri.includes('/oauth/linkedin/callback')
      }
    };

    // Generate OAuth URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: 'test-state-123',
      scope: scope
    });

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    result.generatedUrl = authUrl;

    // Test URL validity
    try {
      new URL(authUrl);
      result.urlValid = true;
    } catch (error: any) {
      result.urlValid = false;
      result.urlError = error.message;
    }

    setTestResult(result);
  };

  const openLinkedInOAuth = () => {
    if (testResult?.generatedUrl) {
      window.open(testResult.generatedUrl, '_blank');
    }
  };

  const copyUrl = () => {
    if (testResult?.generatedUrl) {
      navigator.clipboard.writeText(testResult.generatedUrl);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">LinkedIn OAuth Test</h2>
        
        <button
          onClick={runTest}
          className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Run LinkedIn OAuth Test
        </button>

        {testResult && (
          <div className="space-y-6">
            {/* Environment Variables */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Environment Variables</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client ID</label>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                      {testResult.environment.clientId || 'NOT SET'}
                    </code>
                    {testResult.validation.clientIdValid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client Secret</label>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                      {testResult.environment.clientSecret}
                    </code>
                    {testResult.validation.clientSecretValid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Redirect URI</label>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                      {testResult.environment.redirectUri}
                    </code>
                    {testResult.validation.redirectUriValid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Scope</label>
                  <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                    {testResult.environment.scope}
                  </code>
                </div>
              </div>
            </div>

            {/* Generated OAuth URL */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Generated OAuth URL</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full OAuth URL</label>
                  <div className="flex items-center space-x-2">
                    <code className="bg-white px-3 py-2 rounded border text-sm flex-1 break-all">
                      {testResult.generatedUrl}
                    </code>
                    <button
                      onClick={copyUrl}
                      className="p-2 text-gray-600 hover:text-gray-800"
                      title="Copy URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={openLinkedInOAuth}
                      className="p-2 text-blue-600 hover:text-blue-800"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* URL Validation */}
            <div className={`rounded-lg p-4 ${
              testResult.urlValid ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="flex items-center space-x-2">
                {testResult.urlValid ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <h3 className="text-lg font-semibold">
                  {testResult.urlValid ? 'URL is Valid' : 'URL is Invalid'}
                </h3>
              </div>
              {testResult.urlError && (
                <p className="text-red-600 mt-2">{testResult.urlError}</p>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Next Steps</h3>
              <ol className="list-decimal list-inside space-y-2 text-yellow-700">
                <li>Click "Open in new tab" to test the LinkedIn OAuth URL</li>
                <li>If it fails, check your LinkedIn app configuration</li>
                <li>Ensure redirect URI matches exactly: <code>{window.location.origin}/oauth/linkedin/callback</code></li>
                <li>Make sure your LinkedIn app is in "Live" mode</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedInOAuthTest;

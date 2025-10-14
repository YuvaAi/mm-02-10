import React, { useState } from 'react';
import { AlertCircle, CheckCircle, ExternalLink, Copy, RefreshCw } from 'lucide-react';

const LinkedInOAuthConfigTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runConfigTest = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_LINKEDIN_CLIENT_SECRET;
      const appUrl = import.meta.env.VITE_APP_URL;
      const redirectUri = `${window.location.origin}/oauth/linkedin/callback`;
      const scope = 'openid,profile,email,r_basicprofile,w_member_social,w_organization_social,r_organization_social,rw_organization_admin,r_organization_admin';
      
      const testResults = {
        environment: {
          clientId: clientId || 'NOT SET',
          clientSecret: clientSecret ? '***SET***' : 'NOT SET',
          appUrl: appUrl || 'NOT SET',
          redirectUri: redirectUri,
          scope: scope
        },
        validation: {
          clientIdValid: !!clientId && clientId.length > 0,
          clientSecretValid: !!clientSecret,
          appUrlValid: !!appUrl,
          redirectUriValid: redirectUri.includes('/oauth/linkedin/callback')
        },
        generatedUrl: {
          baseUrl: 'https://www.linkedin.com/oauth/v2/authorization',
          params: {
            response_type: 'code',
            client_id: clientId || 'MISSING_CLIENT_ID',
            redirect_uri: redirectUri,
            state: 'test-state',
            scope: scope
          }
        }
      };

      // Generate the OAuth URL
      const params = new URLSearchParams(testResults.generatedUrl.params);
      const authUrl = `${testResults.generatedUrl.baseUrl}?${params.toString()}`;
      testResults.generatedUrl.fullUrl = authUrl;

      // Test URL validity
      try {
        new URL(authUrl);
        testResults.urlValidation = { valid: true, error: null };
      } catch (error: any) {
        testResults.urlValidation = { valid: false, error: error.message };
      }

      setTestResults(testResults);
    } catch (error: any) {
      setTestResults({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openLinkedInOAuth = () => {
    if (testResults?.generatedUrl?.fullUrl) {
      window.open(testResults.generatedUrl.fullUrl, '_blank');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">LinkedIn OAuth Configuration Test</h2>
          <button
            onClick={runConfigTest}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Testing...' : 'Test Configuration'}</span>
          </button>
        </div>

        {testResults && (
          <div className="space-y-6">
            {/* Environment Variables */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Environment Variables</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client ID</label>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                      {testResults.environment?.clientId}
                    </code>
                    {testResults.validation?.clientIdValid ? (
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
                      {testResults.environment?.clientSecret}
                    </code>
                    {testResults.validation?.clientSecretValid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">App URL</label>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                      {testResults.environment?.appUrl}
                    </code>
                    {testResults.validation?.appUrlValid ? (
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
                      {testResults.environment?.redirectUri}
                    </code>
                    {testResults.validation?.redirectUriValid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Generated OAuth URL */}
            {testResults.generatedUrl && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Generated OAuth URL</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full OAuth URL</label>
                    <div className="flex items-center space-x-2">
                      <code className="bg-white px-3 py-2 rounded border text-sm flex-1 break-all">
                        {testResults.generatedUrl.fullUrl}
                      </code>
                      <button
                        onClick={() => copyToClipboard(testResults.generatedUrl.fullUrl)}
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Parameters</label>
                    <div className="bg-white rounded border p-3">
                      {Object.entries(testResults.generatedUrl.params).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-1">
                          <span className="font-medium text-gray-700">{key}:</span>
                          <span className="text-gray-600">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* URL Validation */}
            {testResults.urlValidation && (
              <div className={`rounded-lg p-4 ${
                testResults.urlValidation.valid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center space-x-2">
                  {testResults.urlValidation.valid ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <h3 className="text-lg font-semibold">
                    {testResults.urlValidation.valid ? 'URL is Valid' : 'URL is Invalid'}
                  </h3>
                </div>
                {testResults.urlValidation.error && (
                  <p className="text-red-600 mt-2">{testResults.urlValidation.error}</p>
                )}
              </div>
            )}

            {/* Error Display */}
            {testResults.error && (
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-red-700">Test Error</h3>
                </div>
                <p className="text-red-600 mt-2">{testResults.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Setup Instructions */}
        <div className="mt-8 bg-yellow-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Setup Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-yellow-700">
            <li>Create a <code>.env</code> file in your project root</li>
            <li>Add <code>VITE_LINKEDIN_CLIENT_ID=your_actual_client_id</code></li>
            <li>Add <code>VITE_LINKEDIN_CLIENT_SECRET=your_actual_client_secret</code></li>
            <li>Add <code>VITE_APP_URL=https://marketmate-101.web.app</code></li>
            <li>Restart your development server</li>
            <li>Run this test again to verify configuration</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default LinkedInOAuthConfigTest;

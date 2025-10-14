import React, { useState } from 'react';
import { FacebookOAuth } from '../api/oauth';

const FacebookOAuthDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const runDiagnostics = () => {
    const info = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: import.meta.env.MODE,
        appUrl: import.meta.env.VITE_APP_URL,
        facebookAppId: import.meta.env.VITE_FACEBOOK_APP_ID,
        hasFacebookSecret: !!import.meta.env.VITE_FACEBOOK_APP_SECRET,
      },
      configuration: {
        clientId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
        redirectUri: `${window.location.origin}/oauth/facebook/callback`,
        expectedRedirectUri: `${import.meta.env.VITE_APP_URL || window.location.origin}/oauth/facebook/callback`,
        scope: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,ads_management,business_management',
        authUrl: 'https://www.facebook.com/v21.0/dialog/oauth'
      },
      url: {
        currentOrigin: window.location.origin,
        currentPath: window.location.pathname,
        currentSearch: window.location.search,
        currentHash: window.location.hash,
      },
      facebook: {
        appIdValid: /^\d+$/.test(import.meta.env.VITE_FACEBOOK_APP_ID || ''),
        appIdLength: (import.meta.env.VITE_FACEBOOK_APP_ID || '').length,
        redirectUriMatch: `${window.location.origin}/oauth/facebook/callback` === `${import.meta.env.VITE_APP_URL || window.location.origin}/oauth/facebook/callback`,
      }
    };

    setDebugInfo(info);
    console.log('Facebook OAuth Debug Info:', info);
  };

  const testOAuth = () => {
    console.log('Testing Facebook OAuth...');
    try {
      FacebookOAuth.initiateAuth();
    } catch (error) {
      console.error('Facebook OAuth Error:', error);
      alert('Facebook OAuth failed: ' + (error as Error).message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Facebook OAuth Debugger
      </h2>
      
      <div className="space-y-4">
        <button
          onClick={runDiagnostics}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg mr-4"
        >
          Run Diagnostics
        </button>
        
        <button
          onClick={testOAuth}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Test Facebook OAuth
        </button>
      </div>

      {debugInfo && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Debug Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300">Environment Variables</h4>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(debugInfo.environment, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300">OAuth Configuration</h4>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(debugInfo.configuration, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300">URL Information</h4>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(debugInfo.url, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300">Facebook Validation</h4>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(debugInfo.facebook, null, 2)}
              </pre>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Common Issues & Solutions:
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• <strong>App Not Available:</strong> Facebook App is in Development mode or permissions not approved</li>
              <li>• <strong>Invalid Redirect URI:</strong> Check that redirect URI matches exactly in Facebook App settings</li>
              <li>• <strong>Missing Permissions:</strong> Ensure all requested permissions are approved in Facebook App Review</li>
              <li>• <strong>App ID Issues:</strong> Verify Facebook App ID is correct and app is active</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Required Facebook App Settings:
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• <strong>Valid OAuth Redirect URIs:</strong> <code>{debugInfo.configuration.redirectUri}</code></li>
              <li>• <strong>App Domains:</strong> <code>{window.location.hostname}</code></li>
              <li>• <strong>App Status:</strong> Should be "Live" (not Development)</li>
              <li>• <strong>Permissions:</strong> All requested permissions should be approved</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacebookOAuthDebugger;

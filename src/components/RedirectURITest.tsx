import React, { useState } from 'react';

const RedirectURITest: React.FC = () => {
  const [redirectUri, setRedirectUri] = useState('');

  const testRedirectURI = () => {
    const currentOrigin = window.location.origin;
    const redirectUri = `${currentOrigin}/oauth/linkedin/callback`;
    setRedirectUri(redirectUri);
    
    console.log('=== Redirect URI Test ===');
    console.log('Current Origin:', currentOrigin);
    console.log('Generated Redirect URI:', redirectUri);
    console.log('This is the redirect URI your app is sending to LinkedIn');
    console.log('Make sure this EXACT URI is registered in your LinkedIn app');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Redirect URI Test</h2>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={testRedirectURI}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Test Redirect URI
          </button>
        </div>

        {redirectUri && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Your App's Redirect URI</h3>
              <code className="bg-white px-3 py-2 rounded border text-sm break-all">
                {redirectUri}
              </code>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ IMPORTANT</h3>
              <p className="text-yellow-700 mb-2">
                This is the redirect URI your app is sending to LinkedIn. 
                You MUST add this EXACT URI to your LinkedIn app configuration.
              </p>
              <ol className="list-decimal list-inside space-y-1 text-yellow-700">
                <li>Go to LinkedIn Developers Console</li>
                <li>Select your app</li>
                <li>Go to Auth tab</li>
                <li>Add this EXACT URI to "Authorized Redirect URLs"</li>
                <li>Save the changes</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RedirectURITest;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../Contexts/AuthContext';
import { getCredentials } from '../firebase/firestore';
import { validateInstagramCredentials } from '../api/instagram';
import { UserCredentials } from '../firebase/types';

const InstagramDebugger: React.FC = () => {
  const { currentUser } = useAuth();
  const [credentials, setCredentials] = useState<UserCredentials | null>(null);
  const [facebookCredentials, setFacebookCredentials] = useState<UserCredentials | null>(null);
  const [allCredentials, setAllCredentials] = useState<UserCredentials[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    console.log('🔍 InstagramDebugger component mounted/updated');
    loadCredentials();
  }, [currentUser]);

  const loadCredentials = async () => {
    if (!currentUser) return;

    try {
      console.log('🔍 Loading credentials for user:', currentUser.uid);
      const { success, data } = await getCredentials(currentUser.uid);
      console.log('🔍 Credentials response:', { success, data });
      
      if (success && data) {
        setAllCredentials(data);
        const instagramCred = data.find((cred: UserCredentials) => cred.type === 'instagram');
        const facebookCred = data.find((cred: UserCredentials) => cred.type === 'facebook');
        setCredentials(instagramCred || null);
        setFacebookCredentials(facebookCred || null);
        console.log('🔍 Instagram credentials found:', instagramCred);
        console.log('🔍 Facebook credentials found:', facebookCred);
        console.log('🔍 All credentials:', data);
      } else {
        console.log('🔍 No credentials found or error:', { success, data });
        setAllCredentials([]);
        setCredentials(null);
        setFacebookCredentials(null);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
      setAllCredentials([]);
      setCredentials(null);
      setFacebookCredentials(null);
    }
  };

  const validateCredentials = async () => {
    if (!credentials) return;

    setIsValidating(true);
    try {
      const result = await validateInstagramCredentials(
        credentials.accessToken,
        credentials.instagramUserId || ''
      );
      setValidationResult(result);
      console.log('✅ Instagram validation result:', result);
    } catch (error) {
      console.error('❌ Instagram validation error:', error);
      setValidationResult({ success: false, error: error });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="bg-bg-alt rounded-xl shadow-md shadow-purple border border-border-purple p-6 max-w-2xl mx-auto hover:shadow-purple-strong transition-all duration-250 animate-slide-in-top">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text text-glow">
          🔥 UPDATED: Social Media Credentials Debugger 🔥
        </h3>
        <button
          onClick={loadCredentials}
          className="bg-gradient-button text-primary-contrast px-4 py-2 rounded-lg hover:bg-gradient-reverse text-sm font-medium shadow-purple hover:shadow-purple-strong transition-all duration-250"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="bg-yellow-100 border-2 border-yellow-400 p-4 rounded-lg text-center">
          <h4 className="text-lg font-bold text-yellow-800 mb-2">🚀 COMPONENT UPDATED! 🚀</h4>
          <p className="text-yellow-700">This debugger now shows ALL social media credentials (Facebook, Instagram, Google)</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Stored Credentials ({allCredentials.length}):</h4>
          {allCredentials.length > 0 ? (
            <div className="space-y-4">
              {allCredentials.map((cred, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900 capitalize">{cred.type} Credentials</h5>
                    {cred.isAutoConnected && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Auto-connected</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {cred.type === 'facebook' && (
                      <>
                        <p><strong>Page Name:</strong> {cred.pageName}</p>
                        <p><strong>Page ID:</strong> {cred.pageId}</p>
                        <p><strong>Access Token:</strong> {cred.accessToken ? 'Present' : 'Missing'}</p>
                      </>
                    )}
                    {cred.type === 'instagram' && (
                      <>
                        <p><strong>Username:</strong> {cred.username}</p>
                        <p><strong>User ID:</strong> {cred.instagramUserId}</p>
                        <p><strong>Access Token:</strong> {cred.accessToken ? 'Present' : 'Missing'}</p>
                      </>
                    )}
                    {cred.type === 'google' && (
                      <>
                        <p><strong>Email:</strong> {cred.email}</p>
                        <p><strong>Display Name:</strong> {cred.displayName}</p>
                      </>
                    )}
                    <p><strong>Created:</strong> {cred.createdAt}</p>
                    <p><strong>Last Validated:</strong> {cred.lastValidated}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-600">
              <span>❌</span>
              <span>No credentials found</span>
            </div>
          )}
        </div>

        {credentials && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Validation:</h4>
            <button
              onClick={validateCredentials}
              disabled={isValidating}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isValidating ? 'Validating...' : 'Validate Instagram Credentials'}
            </button>
            
            {validationResult && (
              <div className="mt-4 p-3 rounded-lg bg-white border">
                <div className="font-medium mb-2">
                  Result: {validationResult.success ? '✅ Valid' : '❌ Invalid'}
                </div>
                {validationResult.error && (
                  <div className="text-red-600 text-sm">
                    <strong>Error:</strong> {validationResult.error}
                  </div>
                )}
                {validationResult.missingPermissions && (
                  <div className="text-orange-600 text-sm">
                    <strong>Missing Permissions:</strong> {validationResult.missingPermissions.join(', ')}
                  </div>
                )}
                {validationResult.username && (
                  <div className="text-green-600 text-sm">
                    <strong>Username:</strong> {validationResult.username}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Common Instagram Issues:</h4>
          <ul className="text-sm space-y-1">
            <li>• <strong>Access Token Expired:</strong> Facebook access tokens expire after 60 days</li>
            <li>• <strong>Missing Permissions:</strong> Need instagram_basic and instagram_content_publish</li>
            <li>• <strong>Wrong User ID:</strong> Must be Instagram Business Account ID, not personal account</li>
            <li>• <strong>Account Type:</strong> Must be Instagram Business Account, not personal account</li>
            <li>• <strong>App Review:</strong> Instagram API requires app review for publishing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InstagramDebugger;

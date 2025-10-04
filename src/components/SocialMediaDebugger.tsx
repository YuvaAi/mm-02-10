import React, { useState, useEffect } from 'react';
import { useAuth } from '../Contexts/AuthContext';
import { getCredentials, saveCredential } from '../firebase/firestore';
import { UserCredentials } from '../firebase/types';

const SocialMediaDebugger: React.FC = () => {
  const { currentUser } = useAuth();
  const [allCredentials, setAllCredentials] = useState<UserCredentials[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    console.log('🔥 NEW SocialMediaDebugger component mounted!');
    loadCredentials();
  }, [currentUser]);

  const loadCredentials = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      console.log('🔥 Loading credentials for user:', currentUser.uid);
      const { success, data } = await getCredentials(currentUser.uid);
      console.log('🔥 Credentials response:', { success, data });
      
      if (success && data) {
        setAllCredentials(data);
        console.log('🔥 All credentials loaded:', data);
      } else {
        console.log('🔥 No credentials found or error:', { success, data });
        setAllCredentials([]);
      }
    } catch (error) {
      console.error('🔥 Error loading credentials:', error);
      setAllCredentials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSaveCredentials = async () => {
    if (!currentUser) return;
    
    setSaving(true);
    setSaveMessage('');
    
    try {
      console.log('🔥 Manually saving Facebook credentials...');
      
      // Get Facebook access token from session storage
      const accessToken = sessionStorage.getItem('facebook_access_token');
      if (!accessToken) {
        throw new Error('No Facebook access token found. Please log in with Facebook first.');
      }

      // Fetch Facebook pages using the access token
      const pagesResponse = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`);
      const pagesData = await pagesResponse.json();

      if (!pagesResponse.ok) {
        throw new Error(pagesData.error?.message || 'Failed to fetch Facebook pages');
      }

      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error('No Facebook pages found. Please make sure you have a Facebook page.');
      }

      // Save credentials for the first page
      const firstPage = pagesData.data[0];
      const saveResult = await saveCredential(currentUser.uid, {
        type: 'facebook',
        accessToken: firstPage.access_token,
        pageId: firstPage.id,
        pageName: firstPage.name,
        email: currentUser.email || '',
        displayName: currentUser.displayName || '',
        photoURL: currentUser.photoURL || '',
        createdAt: new Date().toISOString(),
        lastValidated: new Date().toISOString(),
        isAutoConnected: true
      });

      if (saveResult.success) {
        console.log('🔥 Facebook credentials saved successfully for page:', firstPage.name);
        
        // Try to get Instagram business account
        try {
          const instagramResponse = await fetch(
            `https://graph.facebook.com/v21.0/${firstPage.id}?fields=instagram_business_account&access_token=${firstPage.access_token}`
          );
          const instagramData = await instagramResponse.json();
          
          if (instagramData.instagram_business_account) {
            const instagramAccountResponse = await fetch(
              `https://graph.facebook.com/v21.0/${instagramData.instagram_business_account.id}?fields=id,username&access_token=${firstPage.access_token}`
            );
            const instagramAccountData = await instagramAccountResponse.json();
            
            if (instagramAccountResponse.ok) {
              await saveCredential(currentUser.uid, {
                type: 'instagram',
                accessToken: firstPage.access_token,
                instagramUserId: instagramAccountData.id,
                username: instagramAccountData.username,
                createdAt: new Date().toISOString(),
                lastValidated: new Date().toISOString(),
                isAutoConnected: true
              });
              
              console.log('🔥 Instagram credentials saved successfully for account:', instagramAccountData.username);
            }
          }
        } catch (instagramError) {
          console.warn('🔥 Could not save Instagram credentials:', instagramError);
        }
        
        // Reload credentials after saving
        await loadCredentials();
        
        setSaveMessage(`✅ Success! Facebook credentials saved for page: ${firstPage.name}`);
      } else {
        throw new Error(saveResult.error || 'Failed to save credentials');
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('🔥 Manual save failed:', err);
      setSaveMessage(`❌ Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-600 p-6 max-w-4xl mx-auto transition-all duration-250 animate-slide-in-top">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-glow">
          🚀 NEW SOCIAL MEDIA DEBUGGER v2.0 🚀
        </h3>
        <div className="flex space-x-3">
          <button
            onClick={handleManualSaveCredentials}
            disabled={saving || !currentUser}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark disabled:opacity-50 text-lg font-bold transition-all duration-250"
          >
            {saving ? 'Saving...' : '💾 Save Facebook Credentials'}
          </button>
          <button
            onClick={loadCredentials}
            disabled={loading}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark disabled:opacity-50 text-lg font-bold transition-all duration-250"
          >
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>
      
      <div className="space-y-6">
        {saveMessage && (
          <div className={`border-4 p-6 rounded-lg text-center ${
            saveMessage.includes('✅') 
              ? 'bg-green-200 border-green-500' 
              : 'bg-red-200 border-red-500'
          }`}>
            <p className={`text-lg font-bold ${
              saveMessage.includes('✅') ? 'text-green-800' : 'text-red-800'
            }`}>
              {saveMessage}
            </p>
          </div>
        )}

        <div className="bg-yellow-200 border-4 border-yellow-500 p-6 rounded-lg text-center">
          <h4 className="text-2xl font-bold text-yellow-800 mb-3">🎉 THIS IS THE NEW DEBUGGER! v2.0 - {new Date().toLocaleTimeString()} 🎉</h4>
          <p className="text-yellow-700 text-lg">This shows ALL social media credentials (Facebook, Instagram, Google)</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h4 className="text-xl font-bold text-gray-900 mb-4">
            📊 Stored Credentials ({allCredentials.length})
          </h4>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading credentials...</p>
            </div>
          ) : allCredentials.length > 0 ? (
            <div className="space-y-4">
              {allCredentials.map((cred, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-lg font-bold text-gray-900 dark:text-gray-100 capitalize">
                      {cred.type === 'facebook' && '📘 Facebook'}
                      {cred.type === 'instagram' && '📷 Instagram'}
                      {cred.type === 'google' && '🔍 Google'}
                      {' '}Credentials
                    </h5>
                    {cred.isAutoConnected && (
                      <span className="bg-primary text-white text-sm px-3 py-1 rounded-full font-bold">
                        ✅ Auto-connected
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {cred.type === 'facebook' && (
                      <>
                        <div><strong>📄 Page Name:</strong> {cred.pageName || 'N/A'}</div>
                        <div><strong>🆔 Page ID:</strong> {cred.pageId || 'N/A'}</div>
                        <div><strong>🔑 Access Token:</strong> {cred.accessToken ? '✅ Present' : '❌ Missing'}</div>
                        <div><strong>📧 Email:</strong> {cred.email || 'N/A'}</div>
                      </>
                    )}
                    {cred.type === 'instagram' && (
                      <>
                        <div><strong>👤 Username:</strong> {cred.username || 'N/A'}</div>
                        <div><strong>🆔 User ID:</strong> {cred.instagramUserId || 'N/A'}</div>
                        <div><strong>🔑 Access Token:</strong> {cred.accessToken ? '✅ Present' : '❌ Missing'}</div>
                        <div><strong>📧 Email:</strong> {cred.email || 'N/A'}</div>
                      </>
                    )}
                    {cred.type === 'google' && (
                      <>
                        <div><strong>📧 Email:</strong> {cred.email || 'N/A'}</div>
                        <div><strong>👤 Display Name:</strong> {cred.displayName || 'N/A'}</div>
                        <div><strong>🖼️ Photo URL:</strong> {cred.photoURL ? '✅ Present' : '❌ Missing'}</div>
                        <div><strong>🔑 Access Token:</strong> {cred.accessToken ? '✅ Present' : '❌ Missing'}</div>
                      </>
                    )}
                    <div><strong>📅 Created:</strong> {cred.createdAt || 'N/A'}</div>
                    <div><strong>🔄 Last Validated:</strong> {cred.lastValidated || 'N/A'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">❌</div>
              <h5 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">No Credentials Found</h5>
              <p className="text-gray-600 dark:text-gray-300">No social media credentials have been saved yet.</p>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Go to Facebook Content Creator to save your credentials!</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 p-4 rounded-lg">
          <h5 className="font-bold text-gray-900 dark:text-gray-100 mb-2">🔧 Debug Information:</h5>
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <div><strong>User ID:</strong> {currentUser?.uid || 'Not logged in'}</div>
            <div><strong>Email:</strong> {currentUser?.email || 'N/A'}</div>
            <div><strong>Display Name:</strong> {currentUser?.displayName || 'N/A'}</div>
            <div><strong>Provider:</strong> {currentUser?.providerData?.[0]?.providerId || 'N/A'}</div>
            <div><strong>Facebook Token:</strong> {sessionStorage.getItem('facebook_access_token') ? '✅ Found' : '❌ Not found'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaDebugger;

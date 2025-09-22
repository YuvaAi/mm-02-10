import React, { useState, useEffect } from 'react';
import { useAuth } from '../Contexts/AuthContext';
import { getCredentials } from '../firebase/firestore';
import { UserCredentials } from '../firebase/types';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function CredentialDebugger() {
  const { currentUser } = useAuth();
  const [credentials, setCredentials] = useState<UserCredentials[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionStorageData, setSessionStorageData] = useState<Record<string, string>>({});

  const loadCredentials = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const result = await getCredentials(currentUser.uid);
      if (result.success && result.data) {
        setCredentials(result.data);
      } else {
        setCredentials([]);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionStorage = () => {
    const data: Record<string, string> = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        data[key] = sessionStorage.getItem(key) || '';
      }
    }
    setSessionStorageData(data);
  };

  useEffect(() => {
    loadCredentials();
    loadSessionStorage();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <XCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">No user logged in</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-alt rounded-lg shadow-md shadow-purple border border-border-purple p-6 hover:shadow-purple-strong transition-all duration-250">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text text-glow">Credential Debugger</h3>
        <button
          onClick={() => {
            loadCredentials();
            loadSessionStorage();
          }}
          disabled={loading}
          className="flex items-center space-x-2 bg-gradient-button text-primary-contrast px-3 py-2 rounded-lg hover:bg-gradient-reverse disabled:opacity-50 shadow-purple hover:shadow-purple-strong transition-all duration-250"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>UID:</strong> {currentUser.uid}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Display Name:</strong> {currentUser.displayName}</p>
            <p><strong>Providers:</strong> {currentUser.providerData.map(p => p.providerId).join(', ')}</p>
          </div>
        </div>

        {/* Credentials */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Saved Credentials ({credentials.length})</h4>
          {credentials.length === 0 ? (
            <div className="flex items-center space-x-2 text-yellow-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">No credentials found</span>
            </div>
          ) : (
            <div className="space-y-2">
              {credentials.map((cred, index) => (
                <div key={index} className="bg-white rounded border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-900">{cred.type}</span>
                      {cred.isAutoConnected && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Auto-connected</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {cred.type === 'facebook' && (
                      <>
                        <p><strong>Page:</strong> {cred.pageName}</p>
                        <p><strong>Page ID:</strong> {cred.pageId}</p>
                      </>
                    )}
                    {cred.type === 'instagram' && (
                      <>
                        <p><strong>Username:</strong> {cred.username}</p>
                        <p><strong>User ID:</strong> {cred.instagramUserId}</p>
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
          )}
        </div>

        {/* Session Storage */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Session Storage</h4>
          {Object.keys(sessionStorageData).length === 0 ? (
            <div className="flex items-center space-x-2 text-yellow-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">No session storage data</span>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(sessionStorageData).map(([key, value]) => (
                <div key={key} className="bg-white rounded border p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-900">{key}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <p><strong>Value:</strong> {value.length > 100 ? `${value.substring(0, 100)}...` : value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

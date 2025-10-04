import React, { useState, useEffect } from 'react';
import { useAuth } from '../Contexts/AuthContext';
import { getCredentials } from '../firebase/firestore';
import { UserCredentials } from '../firebase/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function CredentialDebugger() {
  const { currentUser } = useAuth();
  const [credentials, setCredentials] = useState<UserCredentials[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionStorageData, setSessionStorageData] = useState<Record<string, string>>({});
  const [isCredentialsExpanded, setIsCredentialsExpanded] = useState(true);
  const [isSessionStorageExpanded, setIsSessionStorageExpanded] = useState(true);

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
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-200">No user logged in</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-6 transition-all duration-250">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-glow">Credential Debugger</h3>
        <button
          onClick={() => {
            loadCredentials();
            loadSessionStorage();
          }}
          disabled={loading}
          className="flex items-center space-x-2 bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-all duration-250"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* User Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">User Information</h4>
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <p><strong>UID:</strong> {currentUser.uid}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Display Name:</strong> {currentUser.displayName}</p>
            <p><strong>Providers:</strong> {currentUser.providerData.map(p => p.providerId).join(', ')}</p>
          </div>
        </div>

        {/* Credentials */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Saved Credentials ({credentials.length})</h4>
            <button
              onClick={() => setIsCredentialsExpanded(!isCredentialsExpanded)}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              aria-label={isCredentialsExpanded ? 'Collapse credentials' : 'Expand credentials'}
            >
              {isCredentialsExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
          {isCredentialsExpanded && (
            <>
              {credentials.length === 0 ? (
                <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">No credentials found</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {credentials.map((cred, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">{cred.type}</span>
                      {cred.isAutoConnected && (
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded">Auto-connected</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
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
                    {cred.type === 'facebook_ads' && (
                      <>
                        <p><strong>Ad Account ID:</strong> {(cred as any).adAccountId}</p>
                        <p><strong>Ad Account Name:</strong> {(cred as any).adAccountName}</p>
                        <p><strong>Currency:</strong> {(cred as any).currency}</p>
                        <p><strong>Page ID:</strong> {(cred as any).pageId}</p>
                        {(cred as any).campaignId && (
                          <p><strong>Campaign ID:</strong> {(cred as any).campaignId}</p>
                        )}
                      </>
                    )}
                    <p><strong>Created:</strong> {cred.createdAt}</p>
                    <p><strong>Last Validated:</strong> {cred.lastValidated}</p>
                  </div>
                </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Session Storage */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Session Storage</h4>
            <button
              onClick={() => setIsSessionStorageExpanded(!isSessionStorageExpanded)}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              aria-label={isSessionStorageExpanded ? 'Collapse session storage' : 'Expand session storage'}
            >
              {isSessionStorageExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
          {isSessionStorageExpanded && (
            <>
              {Object.keys(sessionStorageData).length === 0 ? (
                <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">No session storage data</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(sessionStorageData).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 p-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">{key}</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        <p><strong>Value:</strong></p>
                        <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-600 rounded border text-xs font-mono break-all overflow-hidden">
                          {value.length > 200 ? `${value.substring(0, 200)}...` : value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

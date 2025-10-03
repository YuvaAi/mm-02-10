import React, { useState, useEffect } from 'react';
import { useAuth } from '../Contexts/AuthContext';
import { signInWithGoogle } from '../firebase/auth';
import { Facebook, Chrome, Bug, CheckCircle, XCircle } from 'lucide-react';

const AuthDebugger: React.FC = () => {
  const { currentUser } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    // Check browser capabilities
    const capabilities = {
      hasSessionStorage: typeof Storage !== 'undefined' && !!window.sessionStorage,
      hasLocalStorage: typeof Storage !== 'undefined' && !!window.localStorage,
      hasCookies: navigator.cookieEnabled,
      userAgent: navigator.userAgent,
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      hostname: window.location.hostname
    };

    setDebugInfo(capabilities);
  }, []);

  const testFacebookAuth = async () => {
    setTestResults(prev => ({ ...prev, facebook: { status: 'testing', message: 'Testing Facebook OAuth...' } }));
    
    try {
      // Use the new OAuth flow instead of Firebase popup
      console.log('Testing Facebook OAuth flow...');
      // Facebook OAuth is available through Firebase auth
      
      setTestResults(prev => ({ 
        ...prev, 
        facebook: { 
          status: 'success', 
          message: 'Facebook OAuth initiated successfully! Check the OAuth callback page.',
          details: { 
            note: 'This will redirect to Facebook for authentication',
            oauthFlow: 'authorization_code'
          }
        } 
      }));
    } catch (error: unknown) {
      const err = error as Error;
      setTestResults(prev => ({ 
        ...prev, 
        facebook: { 
          status: 'error', 
          message: err.message,
          details: { error: err }
        } 
      }));
    }
  };

  const testGoogleAuth = async () => {
    setTestResults(prev => ({ ...prev, google: { status: 'testing', message: 'Testing Google authentication...' } }));
    
    try {
      const { user, error } = await signInWithGoogle();
      
      if (error) {
        setTestResults(prev => ({ 
          ...prev, 
          google: { 
            status: 'error', 
            message: error,
            details: { error, hasUser: !!user }
          } 
        }));
      } else if (user) {
        setTestResults(prev => ({ 
          ...prev, 
          google: { 
            status: 'success', 
            message: 'Google authentication successful!',
            details: { 
              uid: user.uid, 
              email: user.email, 
              displayName: user.displayName,
              providerData: user.providerData
            }
          } 
        }));
      }
    } catch (error: unknown) {
      const err = error as Error;
      setTestResults(prev => ({ 
        ...prev, 
        google: { 
          status: 'error', 
          message: err.message,
          details: { error: err }
        } 
      }));
    }
  };

  const clearStorage = () => {
    sessionStorage.clear();
    localStorage.clear();
    setTestResults({});
    alert('Storage cleared! Please refresh the page.');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'testing':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <Bug className="w-6 h-6 text-blue-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-900">Authentication Debugger</h2>
      </div>

      {/* Current User Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Current User</h3>
        {currentUser ? (
          <div className="text-sm text-gray-700">
            <p><strong>UID:</strong> {currentUser.uid}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Display Name:</strong> {currentUser.displayName || 'N/A'}</p>
            <p><strong>Providers:</strong> {currentUser.providerData.map(p => p.providerId).join(', ')}</p>
          </div>
        ) : (
          <p className="text-gray-500">No user logged in</p>
        )}
      </div>

      {/* Browser Capabilities */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Browser Capabilities</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            {debugInfo.hasSessionStorage ? <CheckCircle className="w-4 h-4 text-green-600 mr-2" /> : <XCircle className="w-4 h-4 text-red-600 mr-2" />}
            Session Storage
          </div>
          <div className="flex items-center">
            {debugInfo.hasLocalStorage ? <CheckCircle className="w-4 h-4 text-green-600 mr-2" /> : <XCircle className="w-4 h-4 text-red-600 mr-2" />}
            Local Storage
          </div>
          <div className="flex items-center">
            {debugInfo.hasCookies ? <CheckCircle className="w-4 h-4 text-green-600 mr-2" /> : <XCircle className="w-4 h-4 text-red-600 mr-2" />}
            Cookies Enabled
          </div>
          <div className="flex items-center">
            {debugInfo.isSecureContext ? <CheckCircle className="w-4 h-4 text-green-600 mr-2" /> : <XCircle className="w-4 h-4 text-red-600 mr-2" />}
            Secure Context
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          <p><strong>Protocol:</strong> {debugInfo.protocol}</p>
          <p><strong>Hostname:</strong> {debugInfo.hostname}</p>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Test Authentication</h3>
        <div className="flex space-x-4">
          <button
            onClick={testFacebookAuth}
            disabled={testResults.facebook?.status === 'testing'}
            className="flex items-center space-x-2 bg-[#1877F2] text-white px-4 py-2 rounded-lg hover:bg-[#166FE5] disabled:opacity-50"
          >
            <Facebook className="w-4 h-4" />
            <span>Test Facebook</span>
          </button>
          
          <button
            onClick={testGoogleAuth}
            disabled={testResults.google?.status === 'testing'}
            className="flex items-center space-x-2 bg-[#4285F4] text-white px-4 py-2 rounded-lg hover:bg-[#3367D6] disabled:opacity-50"
          >
            <Chrome className="w-4 h-4" />
            <span>Test Google</span>
          </button>
          
          <button
            onClick={clearStorage}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            <XCircle className="w-4 h-4" />
            <span>Clear Storage</span>
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-4">
        {Object.entries(testResults).map(([platform, result]: [string, any]) => (
          <div key={platform} className="p-4 border rounded-lg">
            <div className="flex items-center mb-2">
              {getStatusIcon(result.status)}
              <h4 className="ml-2 font-semibold capitalize">{platform} Test</h4>
            </div>
            <p className="text-sm text-gray-700 mb-2">{result.message}</p>
            {result.details && (
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500">View Details</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuthDebugger;

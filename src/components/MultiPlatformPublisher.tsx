import React, { useState, useEffect } from 'react';
import { Facebook, Instagram, Linkedin, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { publishToFacebook } from '../api/facebook';
import { publishToInstagram } from '../api/instagram';
import { publishToLinkedIn } from '../api/linkedin';
import { useAuth } from '../Contexts/AuthContext';
import { getCredentials } from '../firebase/firestore';
import { UserCredentials } from '../firebase/types';

interface MultiPlatformPublisherProps {
  content: string;
  imageUrl?: string;
  mediaFiles?: File[];
  onPublishSuccess?: (platform: string, postId: string) => void;
  onPublishError?: (platform: string, error: string) => void;
}

interface StoredCredentials {
  [key: string]: UserCredentials;
}

interface PublishStatus {
  [key: string]: 'idle' | 'publishing' | 'success' | 'error';
}

const MultiPlatformPublisher: React.FC<MultiPlatformPublisherProps> = ({
  content,
  imageUrl,
  mediaFiles,
  onPublishSuccess,
  onPublishError
}) => {
  const { currentUser } = useAuth();
  const [storedCredentials, setStoredCredentials] = useState<StoredCredentials>({});
  const [publishStatus, setPublishStatus] = useState<PublishStatus>({});
  const [statusMessages, setStatusMessages] = useState<{ [key: string]: string }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const platforms = [
    {
      key: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      credentialType: 'facebook'
    },
    {
      key: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'from-purple-500 to-pink-600',
      hoverColor: 'hover:from-purple-600 hover:to-pink-700',
      credentialType: 'instagram'
    },
    {
      key: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'from-blue-600 to-blue-700',
      hoverColor: 'hover:from-blue-700 hover:to-blue-800',
      credentialType: 'linkedin'
    }
  ];

  useEffect(() => {
    loadCredentials();
  }, [currentUser]);

  const loadCredentials = async () => {
    if (!currentUser) return;

    try {
      console.log('🔄 MultiPlatformPublisher - Loading credentials for user:', currentUser.uid);
      const { success, data } = await getCredentials(currentUser.uid);
      console.log('🔄 MultiPlatformPublisher - getCredentials result:', { success, data });
      
      if (success && data) {
        const credentialsMap: StoredCredentials = {};
        data.forEach((cred: UserCredentials) => {
          credentialsMap[cred.type] = cred;
          console.log(`🔄 MultiPlatformPublisher - Added credential type: ${cred.type}`, cred);
        });
        setStoredCredentials(credentialsMap);
        console.log('📋 MultiPlatformPublisher - Final credentials map:', credentialsMap);
        console.log('📋 MultiPlatformPublisher - Facebook credentials:', credentialsMap.facebook);
      } else {
        console.log('🔄 MultiPlatformPublisher - No credentials found or error');
      }
    } catch (error) {
      console.error('🔄 MultiPlatformPublisher - Error loading credentials:', error);
    }
  };

  const handleRefreshCredentials = async () => {
    setIsRefreshing(true);
    try {
      await loadCredentials();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePublish = async (platform: string) => {
    if (!content.trim()) return;

    const platformConfig = platforms.find(p => p.key === platform);
    if (!platformConfig) return;

    const credentials = storedCredentials[platformConfig.credentialType];
    console.log(`🔑 Credentials for ${platform}:`, credentials);
    console.log(`🔍 Looking for credential type: ${platformConfig.credentialType}`);
    console.log(`📋 All stored credentials:`, storedCredentials);
    
    if (!credentials) {
      setPublishStatus(prev => ({ ...prev, [platform]: 'error' }));
      setStatusMessages(prev => ({ 
        ...prev, 
        [platform]: `No ${platformConfig.name} credentials found. Please add them in Credential Vault.` 
      }));
      onPublishError?.(platform, 'No credentials found');
      return;
    }

    // Additional validation for Instagram
    if (platform === 'instagram') {
      if (!credentials.instagramUserId || !credentials.accessToken) {
        setPublishStatus(prev => ({ ...prev, [platform]: 'error' }));
        setStatusMessages(prev => ({ 
          ...prev, 
          [platform]: `Instagram credentials incomplete. Please check Instagram User ID and Access Token in Credential Vault.` 
        }));
        onPublishError?.(platform, 'Incomplete Instagram credentials');
        return;
      }
    }

    setPublishStatus(prev => ({ ...prev, [platform]: 'publishing' }));
    setStatusMessages(prev => ({ ...prev, [platform]: '' }));

    try {
      let result;
      
      switch (platform) {
        case 'facebook':
          console.log('📤 Publishing to Facebook with credentials:', {
            pageId: credentials.pageId,
            hasAccessToken: !!credentials.accessToken,
            pageName: credentials.pageName
          });
          console.log('📁 MultiPlatformPublisher - Media files for Facebook:', {
            mediaFilesCount: mediaFiles?.length || 0,
            hasImageUrl: !!imageUrl,
            mediaFiles: mediaFiles?.map(f => ({ name: f.name, type: f.type, size: f.size })) || []
          });
          result = await publishToFacebook(
            content,
            imageUrl || '',
            credentials.pageId || '',
            credentials.accessToken,
            mediaFiles
          );
          break;
        case 'instagram':
          console.log('📸 Publishing to Instagram with credentials:', {
            instagramUserId: credentials.instagramUserId,
            hasAccessToken: !!credentials.accessToken,
            username: credentials.username
          });
          
          // Use a fallback image if no image is provided or if the image URL is invalid
          const instagramImageUrl = imageUrl || 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800&h=600';
          
          console.log('📸 Instagram publishing with:', {
            content: content.substring(0, 100) + '...',
            imageUrl: instagramImageUrl,
            instagramUserId: credentials.instagramUserId || 'No user ID',
            hasAccessToken: !!credentials.accessToken
          });
          result = await publishToInstagram(
            content,
            instagramImageUrl,
            credentials.instagramUserId || '',
            credentials.accessToken,
            mediaFiles,
            currentUser?.uid
          );
          console.log('📸 Instagram result:', result);
          break;
        case 'linkedin':
          result = await publishToLinkedIn(
            content,
            credentials.linkedInPageId || credentials.linkedInUserId || '',
            credentials.accessToken,
            mediaFiles,
            credentials.hasOrganizationPages || false
          );
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      if (result.success) {
        setPublishStatus(prev => ({ ...prev, [platform]: 'success' }));
        setStatusMessages(prev => ({ 
          ...prev, 
          [platform]: `Successfully published to ${platformConfig.name}!` 
        }));
        onPublishSuccess?.(platform, result.postId || '');
      } else {
        throw new Error(result.error || 'Publishing failed');
      }
    } catch (error) {
      console.error(`Error publishing to ${platform}:`, error);
      setPublishStatus(prev => ({ ...prev, [platform]: 'error' }));
      setStatusMessages(prev => ({ 
        ...prev, 
        [platform]: `Failed to publish to ${platformConfig.name}. Please check your credentials.` 
      }));
      onPublishError?.(platform, error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const getStatusIcon = (platform: string) => {
    const status = publishStatus[platform];
    switch (status) {
      case 'publishing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Send className="w-4 h-4" />;
    }
  };

  const getButtonClasses = (platform: string) => {
    const platformConfig = platforms.find(p => p.key === platform);
    const status = publishStatus[platform];
    const hasCredentials = storedCredentials[platformConfig?.credentialType || ''];

    let baseClasses = `flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105`;
    
    if (!hasCredentials) {
      return `${baseClasses} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }

    if (status === 'publishing') {
      return `${baseClasses} bg-gray-400 text-white cursor-not-allowed`;
    }

    if (status === 'success') {
      return `${baseClasses} bg-green-500 text-white hover:bg-green-600`;
    }

    if (status === 'error') {
      return `${baseClasses} bg-red-500 text-white hover:bg-red-600`;
    }

    return `${baseClasses} bg-gradient-to-r ${platformConfig?.color} ${platformConfig?.hoverColor} text-white`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Publish to Multiple Platforms
        </h3>
        <button
          onClick={handleRefreshCredentials}
          disabled={isRefreshing}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {isRefreshing ? 'Refreshing...' : '🔄 Refresh Credentials'}
        </button>
      </div>
      
      {/* Debug Info */}
      <div className="bg-gray-100 p-3 rounded mb-4 text-sm">
        <div className="font-semibold mb-2">🔍 Debug Info:</div>
        <div>User ID: {currentUser?.uid || 'Not logged in'}</div>
        <div>Available Credentials: {Object.keys(storedCredentials).join(', ') || 'None'}</div>
        <div>Facebook Credentials: {storedCredentials.facebook ? '✅ Found' : '❌ Missing'}</div>
        <div>Instagram Credentials: {storedCredentials.instagram ? '✅ Found' : '❌ Missing'}</div>
        <div>LinkedIn Credentials: {storedCredentials.linkedin ? '✅ Found' : '❌ Missing'}</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {platforms.map((platform) => {
          const IconComponent = platform.icon;
          const hasCredentials = storedCredentials[platform.credentialType];
          const status = publishStatus[platform.key];
          
          return (
            <div key={platform.key} className="space-y-2">
              <button
                onClick={() => handlePublish(platform.key)}
                disabled={!hasCredentials || status === 'publishing'}
                className={getButtonClasses(platform.key)}
              >
                {getStatusIcon(platform.key)}
                <IconComponent className="w-5 h-5" />
                <span>{platform.name}</span>
              </button>
              
              {statusMessages[platform.key] && (
                <div className={`text-xs p-2 rounded ${
                  status === 'success' 
                    ? 'bg-green-50 text-green-700' 
                    : status === 'error'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-gray-50 text-gray-700'
                }`}>
                  {statusMessages[platform.key]}
                </div>
              )}
              
              {!hasCredentials && (
                <div className="text-xs text-gray-500 text-center">
                  No credentials found
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="text-sm text-gray-600">
        <p>💡 Tip: Add your social media credentials in the Credential Vault to enable publishing.</p>
      </div>
    </div>
  );
};

export default MultiPlatformPublisher;

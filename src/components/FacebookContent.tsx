import React, { useState, useEffect, useCallback } from 'react';
import { Facebook, Instagram, Linkedin, Wand2, Send, AlertCircle, CheckCircle, Loader2, ArrowLeft, Upload, Hash, Image, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generatePostContent, generateImageDescription, generateImageUrl } from '../api/gemini';
import { publishToFacebook } from '../api/facebook';
import { publishToInstagram } from '../api/instagram';
import { publishToLinkedIn } from '../api/linkedin';
import { createAutomaticFacebookAd } from '../api/facebookAds';
import { saveGeneratedContent } from '../firebase/content';
import { useAuth } from '../Contexts/AuthContext';
import { getCredentials, saveCredential } from '../firebase/firestore';
import { UserCredentials } from '../firebase/types';
import MultiPlatformPublisher from './MultiPlatformPublisher';
import { handleSocialSignup } from '../utils/autoConnectSocialAccounts';
import GlassPanel from './GlassPanel';

interface FacebookContentProps {
  platform: 'facebook' | 'instagram' | 'linkedin';
}

interface StoredCredentials {
  [key: string]: UserCredentials;
}

export default function FacebookContent({ platform }: FacebookContentProps) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [storedCredentials, setStoredCredentials] = useState<StoredCredentials>({});
  const [hasCredentials, setHasCredentials] = useState(false);

  // New state variables for additional features
  const [uploadedMedia, setUploadedMedia] = useState<File[]>([]);
  const [maxLength, setMaxLength] = useState(200); // Changed to word count
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [imagePromptOnly, setImagePromptOnly] = useState(false);
  const [generateWithCaption, setGenerateWithCaption] = useState(false);
  const [generatedHashtags, setGeneratedHashtags] = useState('');
  const [finalPost, setFinalPost] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Platform-specific configurations
  const platformConfig = {
    facebook: {
      icon: Facebook,
      name: 'Facebook',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      buttonText: 'Publish to Facebook',
      credentialType: 'Facebook Page'
    },
    instagram: {
      icon: Instagram,
      name: 'Instagram',
      color: 'from-purple-500 via-pink-500 to-orange-400',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
      textColor: 'text-purple-600',
      buttonText: 'Publish to Instagram',
      credentialType: 'Instagram Business Account'
    },
    linkedin: {
      icon: Linkedin,
      name: 'LinkedIn',
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      buttonText: 'Publish to LinkedIn',
      credentialType: 'LinkedIn Profile'
    }
  };

  const config = platformConfig[platform];
  const IconComponent = config.icon;

  const loadAllCredentials = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { success, data } = await getCredentials(currentUser.uid);
      if (success && data) {
        const credentialsMap: StoredCredentials = {};
        data.forEach((cred: UserCredentials) => {
          credentialsMap[cred.type] = cred;
        });
        setStoredCredentials(credentialsMap);
        
        // Check if current platform has credentials
        const hasPlatformCreds = !!credentialsMap[platform];
        console.log('FacebookContent - Platform:', platform);
        console.log('FacebookContent - Current user:', currentUser);
        console.log('FacebookContent - User provider data:', currentUser?.providerData);
        console.log('FacebookContent - Credentials map:', credentialsMap);
        console.log('FacebookContent - Has platform creds:', hasPlatformCreds);
        setHasCredentials(hasPlatformCreds);
      } else {
        setHasCredentials(false);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
      setHasCredentials(false);
    }
  }, [currentUser, platform]);

  useEffect(() => {
    loadAllCredentials();
  }, [currentUser, platform, loadAllCredentials]);

  // Helper functions for new features
  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setUploadedMedia(prev => [...prev, ...fileArray]);
    }
  };

  const removeMedia = (index: number) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const generateHashtags = async (content: string) => {
    try {
      // This would call your AI service to generate relevant hashtags
      const hashtagPrompt = `Generate 5-10 relevant hashtags for this content: ${content}`;
      // For now, we'll use a simple hashtag generation
      const commonHashtags = ['#socialmedia', '#content', '#marketing', '#digital', '#business'];
      return commonHashtags.join(' ');
    } catch (error) {
      console.error('Error generating hashtags:', error);
      return '';
    }
  };

  const generateCaption = async (content: string) => {
    try {
      // This would call your AI service to generate a caption
      const captionPrompt = `Generate a compelling caption for this content: ${content}`;
      // For now, we'll use a simple caption generation
      return `Check out this amazing content! ${content.substring(0, 100)}...`;
    } catch (error) {
      console.error('Error generating caption:', error);
      return '';
    }
  };

  const truncateToWordCount = (text: string, wordCount: number) => {
    const words = text.split(' ');
    if (words.length <= wordCount) return text;
    return words.slice(0, wordCount).join(' ') + '...';
  };

  // Manual connect function for users who logged in with Facebook but credentials weren't saved
  const handleManualConnect = async () => {
    if (!currentUser) return;
    
    setIsConnecting(true);
    try {
      console.log('Manually connecting Facebook account...');
      await handleSocialSignup(currentUser);
      
      // Reload credentials after connection
      await loadAllCredentials();
      
      setStatusMessage('Facebook account connected successfully!');
      setPublishStatus('success');
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Manual connect failed:', err);
      setStatusMessage(`Failed to connect Facebook account: ${err.message}`);
      setPublishStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDirectSaveCredentials = async () => {
    if (!currentUser) return;
    
    setIsConnecting(true);
    try {
      console.log('Directly saving Facebook credentials...');
      
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
        console.log('Facebook credentials saved successfully for page:', firstPage.name);
        
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
              
              console.log('Instagram credentials saved successfully for account:', instagramAccountData.username);
            }
          }
        } catch (instagramError) {
          console.warn('Could not save Instagram credentials:', instagramError);
        }
        
        // Reload credentials after saving
        await loadAllCredentials();
        
        setStatusMessage(`✅ Facebook credentials saved successfully! Connected to page: ${firstPage.name}`);
        setPublishStatus('success');
      } else {
        throw new Error(saveResult.error || 'Failed to save credentials');
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Direct save failed:', err);
      setStatusMessage(`❌ Failed to save credentials: ${err.message}`);
      setPublishStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRefreshCredentials = async () => {
    setIsRefreshing(true);
    try {
      console.log('Refreshing credentials...');
      await loadAllCredentials();
      console.log('Credentials refreshed');
    } catch (error) {
      console.error('Error refreshing credentials:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const createFinalPost = (content: string, hashtags: string, caption?: string) => {
    if (imagePromptOnly) {
      return content; // Only return the content without hashtags
    }
    
    let finalContent = content;
    
    // Apply word count limit
    finalContent = truncateToWordCount(content, maxLength);
    
    // Add caption if enabled
    if (generateWithCaption && caption) {
      finalContent = `${caption}\n\n${finalContent}`;
    }
    
    // Add hashtags if enabled
    if (includeHashtags && hashtags) {
      finalContent = `${finalContent}\n\n${hashtags}`;
    }
    
    return finalContent;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setPublishStatus('idle');
    
    try {
      // Generate post content
      const content = await generatePostContent(prompt, 'General');
      setGeneratedContent(content);
      
      // Generate hashtags if enabled
      if (includeHashtags && !imagePromptOnly) {
        const hashtags = await generateHashtags(content);
        setGeneratedHashtags(hashtags);
      }
      
      // Generate caption if enabled
      let caption: string | undefined;
      if (generateWithCaption && !imagePromptOnly) {
        caption = await generateCaption(content);
      }

      // Create final post
      const finalPostContent = createFinalPost(content, generatedHashtags, caption);
      setFinalPost(finalPostContent);
      
      // Generate image description and then image URL (only if not image prompt only and no uploaded media)
      if (!imagePromptOnly && uploadedMedia.length === 0) {
        const imageDescription = await generateImageDescription(prompt, 'General');
        const imageUrl = await generateImageUrl(imageDescription);
        setGeneratedImage(imageUrl);
      }
      
      // If uploaded media exists, use the first image/video for preview
      if (uploadedMedia.length > 0) {
        const firstMedia = uploadedMedia[0];
        if (firstMedia.type.startsWith('image/')) {
          const imageUrl = URL.createObjectURL(firstMedia);
          setGeneratedImage(imageUrl);
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
      setStatusMessage('Failed to generate content. Please try again.');
      setPublishStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!finalPost && !generatedContent || !hasCredentials) return;

    setIsPublishing(true);
    setPublishStatus('idle');

    try {
      let result;
      
      // Prepare media files for upload
      const mediaFiles = uploadedMedia.length > 0 ? uploadedMedia : [];
      
      console.log('📁 FacebookContent - Media files for publishing:', {
        uploadedMediaCount: uploadedMedia.length,
        mediaFilesCount: mediaFiles.length,
        hasGeneratedImage: !!generatedImage,
        mediaFiles: mediaFiles.map(f => ({ name: f.name, type: f.type, size: f.size }))
      });
      
      switch (platform) {
        case 'facebook': {
          const facebookCreds = storedCredentials.facebook;
          if (!facebookCreds) {
            throw new Error('Facebook credentials not found');
          }
          result = await publishToFacebook(
            finalPost || generatedContent,
            generatedImage,
            facebookCreds.pageId || '',
            facebookCreds.accessToken,
            mediaFiles // Pass uploaded media files
          );
          
          // Create Facebook ad if ads credentials exist and post was successful
          const facebookAdsCreds = storedCredentials.facebook_ads;
          if (facebookAdsCreds && result.success && result.postId) {
            try {
              await createAutomaticFacebookAd(
                result.postId,
                generatedImage,
                finalPost || generatedContent
              );
              setStatusMessage('Published to Facebook and ad created successfully!');
            } catch (adError) {
              console.error('Ad creation failed:', adError);
              setStatusMessage('Published to Facebook successfully, but ad creation failed.');
            }
          } else {
            setStatusMessage('Published to Facebook successfully!');
          }
          break;
        }

        case 'instagram': {
          const instagramCreds = storedCredentials.instagram;
          if (!instagramCreds) {
            throw new Error('Instagram credentials not found');
          }
          result = await publishToInstagram(
            finalPost || generatedContent,
            generatedImage,
            instagramCreds.instagramUserId || '',
            instagramCreds.accessToken,
            mediaFiles, // Pass uploaded media files
            currentUser?.uid
          );
          setStatusMessage('Published to Instagram successfully!');
          break;
        }

        case 'linkedin': {
          const linkedInCreds = storedCredentials.linkedin;
          if (!linkedInCreds) {
            throw new Error('LinkedIn credentials not found');
          }
          result = await publishToLinkedIn(
            finalPost || generatedContent, 
            linkedInCreds.linkedInUserId || '', 
            linkedInCreds.accessToken,
            mediaFiles // Pass uploaded media files
          );
          setStatusMessage('Published to LinkedIn successfully!');
          break;
        }

        default:
          throw new Error('Unsupported platform');
      }

      if (result.success) {
        setPublishStatus('success');
        
        // Save to Firestore
        if (currentUser) {
          await saveGeneratedContent(currentUser.uid, {
            generatedContent: finalPost || generatedContent,
            generatedImageUrl: generatedImage,
            imageDescription: '',
            category: 'General',
            prompt,
            status: 'published',
            postId: result.postId,
            platform,
            hashtags: generatedHashtags,
            uploadedMedia: uploadedMedia.map(file => file.name)
          });
        }
      } else {
        throw new Error(result.error || 'Publishing failed');
      }
    } catch (error) {
      console.error('Publishing error:', error);
      setStatusMessage(`Failed to publish to ${config.name}. Please check your credentials and try again.`);
      setPublishStatus('error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-main animate-gradient py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with Back Button */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-text-secondary hover:text-text transition-all duration-250 mr-6 hover:bg-bg-secondary px-3 py-2 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Header */}
        <GlassPanel variant="purple" className="animate-slide-in-top">
          <div className="glass-panel-content">
            <div className="glass-panel-header">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-gradient-button rounded-lg shadow-purple hover:shadow-purple-strong transition-all duration-250 hover:scale-110">
                  <IconComponent className="w-6 h-6 text-primary-contrast" />
                </div>
                <div>
                  <h1 className="glass-panel-title text-2xl font-bold">
                    {config.name} Content Creator
                  </h1>
                  <p className="glass-panel-subtitle">
                    Generate and publish content to your {config.credentialType}
                  </p>
                </div>
              </div>
            </div>

          {/* Status Message */}
          {publishStatus !== 'idle' && statusMessage && (
            <div className={`rounded-lg p-4 mb-4 ${
              publishStatus === 'success' 
                ? 'bg-bg-alt border border-success shadow-success' 
                : 'bg-bg-alt border border-error shadow-error'
            }`}>
              <div className="flex items-center space-x-2">
                {publishStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-error" />
                )}
                <p className={publishStatus === 'success' ? 'text-success' : 'text-error'}>
                  {statusMessage}
                </p>
              </div>
            </div>
          )}

          {/* Debug Info */}
          <div className="bg-bg border border-border rounded-lg p-4 mb-4 shadow-md">
            <h3 className="font-medium text-text mb-2">Debug Info:</h3>
            <div className="text-sm text-text-secondary space-y-1">
              <p><strong>Platform:</strong> {platform}</p>
              <p><strong>Current User:</strong> {currentUser ? 'Logged in' : 'Not logged in'}</p>
              <p><strong>User ID:</strong> {currentUser?.uid || 'N/A'}</p>
              <p><strong>Has Credentials:</strong> {hasCredentials ? 'Yes' : 'No'}</p>
              <p><strong>Facebook Access Token:</strong> {sessionStorage.getItem('facebook_access_token') ? 'Found' : 'Not found'}</p>
            </div>
          </div>

          {!hasCredentials && (
            <div className="bg-bg-alt border border-warning rounded-lg p-4 shadow-warning">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  <p className="text-warning">
                    Please add your {config.name} credentials in the Credential Vault to publish content.
                  </p>
                </div>
                {platform === 'facebook' && currentUser && (
                  <div className="ml-4 flex flex-wrap gap-2">
                    <button
                      onClick={handleDirectSaveCredentials}
                      disabled={isConnecting}
                      className="bg-success text-gray-900 px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-md hover:shadow-lg transition-all duration-250"
                    >
                      {isConnecting ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </div>
                      ) : (
                        'Save Facebook Credentials'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        console.log('Current user:', currentUser);
                        console.log('Provider data:', currentUser?.providerData);
                        console.log('Session storage:', sessionStorage.getItem('facebook_access_token'));
                        loadAllCredentials();
                      }}
                      className="bg-bg-alt text-text border border-border px-4 py-2 rounded-lg hover:bg-bg-secondary text-sm font-medium shadow-md hover:shadow-lg transition-all duration-250"
                    >
                      Debug
                    </button>
                    <button
                      onClick={handleRefreshCredentials}
                      disabled={isRefreshing}
                      className="bg-blue-600 text-gray-900 px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                    >
                      {isRefreshing ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Refreshing...</span>
                        </div>
                      ) : (
                        'Refresh'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Always show button for Facebook platform */}
          {platform === 'facebook' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <p className="text-blue-800">
                    Facebook platform detected. Click below to save your credentials.
                  </p>
                </div>
                <div className="ml-4 flex flex-wrap gap-2">
                  <button
                    onClick={handleDirectSaveCredentials}
                    disabled={isConnecting}
                    className="bg-green-600 text-gray-900 px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {isConnecting ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </div>
                    ) : (
                      'Save Facebook Credentials'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      console.log('=== DEBUG INFO ===');
                      console.log('Platform:', platform);
                      console.log('Current user:', currentUser);
                      console.log('Provider data:', currentUser?.providerData);
                      console.log('Session storage:', sessionStorage.getItem('facebook_access_token'));
                      console.log('Has credentials:', hasCredentials);
                      loadAllCredentials();
                    }}
                    className="bg-gray-600 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-700 text-sm font-medium"
                  >
                    Debug
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </GlassPanel>

        {/* Content Generation */}
        <GlassPanel variant="default" className="animate-slide-in-left">
          <div className="glass-panel-content">
            <div className="glass-panel-header">
              <h2 className="glass-panel-title text-lg font-semibold mb-2">
                Generate Content
              </h2>
              <p className="glass-panel-subtitle">Create engaging content with AI assistance</p>
            </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Content Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Describe the content you want to create for ${config.name}...`}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
                rows={4}
              />
            </div>

            {/* New Features Section */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              {/* Media Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Upload Media (Images/Videos)
                </label>
                <div className="flex items-center space-x-4">
                  <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 flex items-center space-x-2 transition-colors">
                    <Upload className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Choose Files</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleMediaUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-gray-500">
                    {uploadedMedia.length} file(s) selected
                  </span>
                </div>
                {uploadedMedia.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {uploadedMedia.map((file, index) => (
                      <div key={index} className="relative bg-gray-100 rounded-lg p-2 flex items-center space-x-2">
                        <span className="text-sm text-gray-700 truncate max-w-32">
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeMedia(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Max Length */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Max Content Length (Words)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={maxLength}
                    onChange={(e) => setMaxLength(Number(e.target.value))}
                    className="flex-1"
                    aria-label="Content length slider"
                    title="Adjust maximum content length"
                  />
                  <span className="text-sm text-gray-700 min-w-[60px]">{maxLength} words</span>
                </div>
              </div>

              {/* Toggle Buttons */}
              <div className="flex flex-wrap gap-4">
                {/* Include Hashtags Toggle */}
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHashtags}
                    onChange={(e) => setIncludeHashtags(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Hash className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-900">Include Hashtags</span>
                </label>

                {/* Image Prompt Only Toggle */}
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={imagePromptOnly}
                    onChange={(e) => setImagePromptOnly(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Image className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-900">Image Prompt Only</span>
                </label>

                {/* Generate Post with Caption Toggle */}
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateWithCaption}
                    onChange={(e) => setGenerateWithCaption(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Wand2 className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Generate Post with Caption</span>
                </label>
              </div>

              {/* Generate Post Button */}
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-gray-900 py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating Post...</span>
                  </>
                                 ) : (
                   <>
                     <FileText className="w-5 h-5" />
                     <span>Generate</span>
                   </>
                 )}
              </button>
            </div>
          </div>
          </div>
        </GlassPanel>

        {/* Generated Content Preview */}
        {(generatedContent || uploadedMedia.length > 0) && (
          <GlassPanel variant="purple" className="animate-slide-in-right">
            <div className="glass-panel-content">
              <div className="glass-panel-header">
                <h2 className="glass-panel-title text-lg font-semibold mb-2">
                  Generated Content Preview
                </h2>
                <p className="glass-panel-subtitle">Review and edit your generated content before publishing</p>
              </div>
            
            <div className="space-y-4">
              {/* Uploaded Media Preview */}
              {uploadedMedia.length > 0 && (
                <div>
                  <h3 className="text-md font-medium text-text mb-2">Uploaded Media</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedMedia.map((file, index) => (
                      <div key={index} className="relative bg-bg rounded-lg p-2 border border-border">
                        <div className="aspect-square bg-bg-alt rounded flex items-center justify-center">
                          <span className="text-xs text-text-secondary text-center">
                            {file.type.startsWith('image/') ? '📷' : '🎥'} {file.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Image */}
              {generatedImage && !imagePromptOnly && (
                <div className="relative">
                  <h3 className="text-md font-medium text-text mb-2">Generated Image</h3>
                  <img
                    src={generatedImage}
                    alt="Generated content"
                    className="w-full max-w-md mx-auto rounded-lg shadow-sm"
                  />
                </div>
              )}
              
                             {/* Content Preview */}
               {generatedContent && (
                 <div>
                   <h3 className="text-md font-medium text-text mb-2">Content</h3>
                   <div className="bg-bg rounded-lg p-4 border border-border">
                     <p className="text-text whitespace-pre-wrap">
                       {generatedContent}
                     </p>
                     <div className="mt-2 text-xs text-text-secondary">
                       Word count: {generatedContent.split(' ').length} words
                     </div>
                   </div>
                 </div>
               )}

               {/* Caption Preview */}
               {generateWithCaption && !imagePromptOnly && (
                 <div>
                   <h3 className="text-md font-medium text-text mb-2">Generated Caption</h3>
                   <div className="bg-bg-alt rounded-lg p-4 border border-primary shadow-purple">
                     <p className="text-text whitespace-pre-wrap">
                       {finalPost.split('\n\n')[0]}
                     </p>
                   </div>
                 </div>
               )}

              {/* Hashtags Preview */}
              {generatedHashtags && includeHashtags && !imagePromptOnly && (
                <div>
                  <h3 className="text-md font-medium text-text mb-2">Generated Hashtags</h3>
                  <div className="bg-bg-alt rounded-lg p-4 border border-accent shadow-violet">
                    <p className="text-text whitespace-pre-wrap">
                      {generatedHashtags}
                    </p>
                  </div>
                </div>
              )}

              {/* Final Post Preview */}
              {finalPost && (
                <div>
                  <h3 className="text-md font-medium text-text mb-2">Final Post</h3>
                  <div className="bg-bg-alt rounded-lg p-4 border border-success shadow-success">
                    <p className="text-text whitespace-pre-wrap">
                      {finalPost}
                    </p>
                    <div className="mt-2 text-xs text-success">
                       Word count: {finalPost.split(' ').length} words
                     </div>
                  </div>
                </div>
              )}

              {/* Multi-Platform Publishing */}
              <MultiPlatformPublisher
                content={finalPost || generatedContent}
                imageUrl={generatedImage}
                mediaFiles={uploadedMedia}
                onPublishSuccess={(platform, postId) => {
                  console.log(`Successfully published to ${platform} with post ID: ${postId}`);
                  // Save to Firebase if needed
                  if (currentUser) {
                    saveGeneratedContent(currentUser.uid, {
                      content: finalPost || generatedContent,
                      imageUrl: generatedImage,
                      imageDescription: '',
                      category: 'General',
                      prompt,
                      status: 'published',
                      postId,
                      platform,
                      hashtags: generatedHashtags,
                      uploadedMedia: uploadedMedia.map(file => file.name)
                    });
                  }
                }}
                onPublishError={(platform, error) => {
                  console.error(`Error publishing to ${platform}:`, error);
                }}
              />

              {/* Original single platform publish button */}
              {hasCredentials && (
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full bg-gradient-accent text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-gradient-reverse transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-violet hover:shadow-violet-strong btn-ripple"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>{config.buttonText}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </GlassPanel>
        )}

        {/* Status Messages */}
        {publishStatus !== 'idle' && (
          <div className={`rounded-lg p-4 mb-6 ${
            publishStatus === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {publishStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={publishStatus === 'success' ? 'text-green-800' : 'text-red-800'}>
                {statusMessage}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useContentGenerator } from '../Contexts/ContentGeneratorContext';
import { useAuth } from '../Contexts/AuthContext';
import { saveGeneratedContent } from '../firebase/content';
import MultiPlatformPublisher from './MultiPlatformPublisher';
import GlassPanel from './GlassPanel';

const ContentPreviewAndPublish: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    prompt,
    generatedContent,
    generatedImage,
    uploadedMedia,
    finalPost,
    generatedHashtags,
    generatedKeywords,
    imagePromptOnly,
    generateWithCaption,
    includeHashtags,
    includeKeywords,
  } = useContentGenerator();

  // Only show if there's generated content or uploaded media
  if (!generatedContent && uploadedMedia.length === 0) {
    return null;
  }

  return (
    <GlassPanel variant="purple" className="animate-slide-in-right">
      <div className="glass-panel-content">
        <div className="glass-panel-header">
          <h2 className="glass-panel-title text-lg font-semibold mb-1">
            Generated Content Preview
          </h2>
          <p className="glass-panel-subtitle text-sm">Review and publish your content to multiple platforms</p>
        </div>
      
        <div className="space-y-3">
          {/* Uploaded Media Preview */}
          {uploadedMedia.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text dark:text-gray-100 mb-1">Uploaded Media</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {uploadedMedia.map((file, index) => (
                  <div key={index} className="relative bg-white dark:bg-gray-700 rounded-md p-1.5 border border-gray-200 dark:border-gray-600 shadow-sm">
                    <div className="aspect-square bg-gray-50 dark:bg-gray-600 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-700 dark:text-gray-200 text-center">
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
              <h3 className="text-sm font-medium text-text dark:text-gray-100 mb-1">Generated Image</h3>
              <img
                src={generatedImage}
                alt="Generated content"
                className="w-full max-w-sm mx-auto rounded-lg shadow-sm"
              />
            </div>
          )}
          
          {/* Content Preview */}
          {generatedContent && (
            <div>
              <h3 className="text-sm font-medium text-text dark:text-gray-100 mb-1">Content</h3>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 shadow-sm">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-sm">
                  {generatedContent}
                </p>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Word count: {generatedContent.split(' ').length} words
                </div>
              </div>
            </div>
          )}

          {/* Caption Preview */}
          {generateWithCaption && !imagePromptOnly && finalPost && (
            <div>
              <h3 className="text-sm font-medium text-text dark:text-gray-100 mb-1">Generated Caption</h3>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 shadow-sm">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-sm">
                  {finalPost.split('\n\n')[0]}
                </p>
              </div>
            </div>
          )}

          {/* Keywords Preview */}
          {generatedKeywords && includeKeywords && !imagePromptOnly && (
            <div>
              <h3 className="text-sm font-medium text-text dark:text-gray-100 mb-1">Generated Keywords</h3>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 shadow-sm">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-sm">
                  {generatedKeywords}
                </p>
              </div>
            </div>
          )}

          {/* Hashtags Preview */}
          {generatedHashtags && includeHashtags && !imagePromptOnly && (
            <div>
              <h3 className="text-sm font-medium text-text dark:text-gray-100 mb-1">Generated Hashtags</h3>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 shadow-sm">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-sm">
                  {generatedHashtags}
                </p>
              </div>
            </div>
          )}

          {/* Final Post Preview */}
          {finalPost && (
            <div>
              <h3 className="text-sm font-medium text-text dark:text-gray-100 mb-1">Final Post</h3>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 shadow-sm">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-sm">
                  {finalPost}
                </p>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Word count: {finalPost.split(' ').length} words
                </div>
              </div>
            </div>
          )}

          {/* Multi-Platform Publishing */}
          <div className="mt-3">
            <MultiPlatformPublisher
              content={finalPost || generatedContent}
              imageUrl={generatedImage}
              mediaFiles={uploadedMedia}
              onPublishSuccess={(platform, postId) => {
                console.log(`Successfully published to ${platform} with post ID: ${postId}`);
                // Save to Firebase
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
                    keywords: generatedKeywords,
                    uploadedMedia: uploadedMedia.map(file => file.name)
                  });
                }
              }}
              onPublishError={(platform, error) => {
                console.error(`Error publishing to ${platform}:`, error);
              }}
            />
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};

export default ContentPreviewAndPublish;


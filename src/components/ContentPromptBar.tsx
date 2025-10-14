import React from 'react';
import { Upload, Hash, Image, FileText, Loader2, X, Tag } from 'lucide-react';
import { generatePostContent, generateImageDescription, generateImageUrl } from '../api/gemini';
import { useContentGenerator } from '../Contexts/ContentGeneratorContext';
import GlassPanel from './GlassPanel';

const ContentPromptBar: React.FC = () => {
  const {
    prompt,
    setPrompt,
    uploadedMedia,
    setUploadedMedia,
    maxLength,
    setMaxLength,
    includeHashtags,
    setIncludeHashtags,
    includeKeywords,
    setIncludeKeywords,
    imagePromptOnly,
    setImagePromptOnly,
    generateWithCaption,
    setGenerateWithCaption,
    setGeneratedContent,
    setGeneratedImage,
    setGeneratedHashtags,
    setGeneratedKeywords,
    setFinalPost,
    isGenerating,
    setIsGenerating,
    resetContent,
  } = useContentGenerator();

  // Helper functions
  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setUploadedMedia([...uploadedMedia, ...fileArray]);
    }
  };

  const removeMedia = (index: number) => {
    setUploadedMedia(uploadedMedia.filter((_, i) => i !== index));
  };

  const generateHashtags = async (content: string) => {
    try {
      const commonHashtags = ['#socialmedia', '#content', '#marketing', '#digital', '#business'];
      return commonHashtags.join(' ');
    } catch (error) {
      console.error('Error generating hashtags:', error);
      return '';
    }
  };

  const generateKeywords = async (content: string) => {
    try {
      // Extract key terms from content for SEO and discoverability
      const words = content.toLowerCase().split(' ').filter(word => word.length > 3);
      const commonKeywords = ['marketing', 'business', 'growth', 'strategy', 'digital', 'content', 'social', 'engagement'];
      const uniqueKeywords = [...new Set([...words.slice(0, 5), ...commonKeywords])].slice(0, 8);
      return uniqueKeywords.join(', ');
    } catch (error) {
      console.error('Error generating keywords:', error);
      return '';
    }
  };

  const generateCaption = async (content: string) => {
    try {
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

  const createFinalPost = (content: string, hashtags: string, keywords: string, caption?: string) => {
    if (imagePromptOnly) {
      return content;
    }
    
    let finalContent = content;
    
    // Apply word count limit
    finalContent = truncateToWordCount(content, maxLength);
    
    // Add caption if enabled
    if (generateWithCaption && caption) {
      finalContent = `${caption}\n\n${finalContent}`;
    }
    
    // Add keywords if enabled
    if (includeKeywords && keywords) {
      finalContent = `${finalContent}\n\nKeywords: ${keywords}`;
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
    
    try {
      // Generate post content
      const content = await generatePostContent(prompt, 'General');
      setGeneratedContent(content);
      
      // Generate hashtags if enabled
      let hashtags = '';
      if (includeHashtags && !imagePromptOnly) {
        hashtags = await generateHashtags(content);
        setGeneratedHashtags(hashtags);
      }
      
      // Generate keywords if enabled
      let keywords = '';
      if (includeKeywords && !imagePromptOnly) {
        keywords = await generateKeywords(content);
        setGeneratedKeywords(keywords);
      }
      
      // Generate caption if enabled
      let caption: string | undefined;
      if (generateWithCaption && !imagePromptOnly) {
        caption = await generateCaption(content);
      }

      // Create final post
      const finalPostContent = createFinalPost(content, hashtags, keywords, caption);
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
      alert('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <GlassPanel variant="default" className="animate-slide-in-left">
      <div className="glass-panel-content">
        <div className="glass-panel-header">
          <h2 className="glass-panel-title text-lg font-semibold mb-1">
            Generate Content
          </h2>
          <p className="glass-panel-subtitle text-sm">Create engaging content with AI assistance</p>
        </div>
      
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Content Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the content you want to create..."
              className="w-full px-3 py-2 glass-panel-input resize-none"
              rows={3}
            />
          </div>

          {/* New Features Section */}
          <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Upload Media (Images/Videos)
              </label>
              <div className="flex items-center space-x-3">
                <label className="cursor-pointer glass-panel-input hover:bg-opacity-100 px-3 py-1.5 flex items-center space-x-2 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Choose Files</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {uploadedMedia.length} file(s) selected
                </span>
              </div>
              {uploadedMedia.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {uploadedMedia.map((file, index) => (
                    <div key={index} className="relative glass-panel-input p-1.5 flex items-center space-x-1.5">
                      <span className="text-xs truncate max-w-24">
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeMedia(index)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
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
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Max Content Length (Words)
              </label>
              <div className="flex items-center space-x-3">
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
                <span className="text-xs text-gray-600 dark:text-gray-300 min-w-[50px]">{maxLength} words</span>
              </div>
            </div>

            {/* Toggle Buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Include Hashtags Toggle */}
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHashtags}
                  onChange={(e) => setIncludeHashtags(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <Hash className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                <span className="text-xs text-gray-700 dark:text-gray-200">Include Hashtags</span>
              </label>

              {/* Include Keywords Toggle */}
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeKeywords}
                  onChange={(e) => setIncludeKeywords(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <Tag className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                <span className="text-xs text-gray-700 dark:text-gray-200">Include Keywords</span>
              </label>

              {/* Image Prompt Only Toggle */}
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={imagePromptOnly}
                  onChange={(e) => setImagePromptOnly(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <Image className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                <span className="text-xs text-gray-700 dark:text-gray-200">Image Prompt Only</span>
              </label>

              {/* Generate Post with Caption Toggle */}
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateWithCaption}
                  onChange={(e) => setGenerateWithCaption(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <FileText className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                <span className="text-xs text-gray-700 dark:text-gray-200">Generate Post with Caption</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="flex-1 bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-dark transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md shadow-turquoise hover:shadow-turquoise-strong transform hover:scale-105 disabled:transform-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Generate</span>
                  </>
                )}
              </button>
              
              <button
                onClick={resetContent}
                disabled={isGenerating}
                className="px-4 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                title="Clear all fields and start over"
              >
                <X className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};

export default ContentPromptBar;


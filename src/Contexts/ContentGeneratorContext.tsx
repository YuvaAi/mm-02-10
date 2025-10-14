import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ContentGeneratorState {
  prompt: string;
  generatedContent: string;
  generatedImage: string;
  uploadedMedia: File[];
  maxLength: number;
  includeHashtags: boolean;
  includeKeywords: boolean;
  imagePromptOnly: boolean;
  generateWithCaption: boolean;
  generatedHashtags: string;
  generatedKeywords: string;
  finalPost: string;
  isGenerating: boolean;
}

interface ContentGeneratorContextType extends ContentGeneratorState {
  setPrompt: (prompt: string) => void;
  setGeneratedContent: (content: string) => void;
  setGeneratedImage: (image: string) => void;
  setUploadedMedia: (media: File[]) => void;
  setMaxLength: (length: number) => void;
  setIncludeHashtags: (include: boolean) => void;
  setIncludeKeywords: (include: boolean) => void;
  setImagePromptOnly: (only: boolean) => void;
  setGenerateWithCaption: (generate: boolean) => void;
  setGeneratedHashtags: (hashtags: string) => void;
  setGeneratedKeywords: (keywords: string) => void;
  setFinalPost: (post: string) => void;
  setIsGenerating: (generating: boolean) => void;
  resetContent: () => void;
}

const ContentGeneratorContext = createContext<ContentGeneratorContextType | undefined>(undefined);

export const useContentGenerator = () => {
  const context = useContext(ContentGeneratorContext);
  if (!context) {
    throw new Error('useContentGenerator must be used within a ContentGeneratorProvider');
  }
  return context;
};

interface ContentGeneratorProviderProps {
  children: ReactNode;
}

export const ContentGeneratorProvider: React.FC<ContentGeneratorProviderProps> = ({ children }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState<File[]>([]);
  const [maxLength, setMaxLength] = useState(200);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeKeywords, setIncludeKeywords] = useState(true);
  const [imagePromptOnly, setImagePromptOnly] = useState(false);
  const [generateWithCaption, setGenerateWithCaption] = useState(false);
  const [generatedHashtags, setGeneratedHashtags] = useState('');
  const [generatedKeywords, setGeneratedKeywords] = useState('');
  const [finalPost, setFinalPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const resetContent = () => {
    setPrompt('');
    setGeneratedContent('');
    setGeneratedImage('');
    setUploadedMedia([]);
    setGeneratedHashtags('');
    setGeneratedKeywords('');
    setFinalPost('');
  };

  const value: ContentGeneratorContextType = {
    prompt,
    generatedContent,
    generatedImage,
    uploadedMedia,
    maxLength,
    includeHashtags,
    includeKeywords,
    imagePromptOnly,
    generateWithCaption,
    generatedHashtags,
    generatedKeywords,
    finalPost,
    isGenerating,
    setPrompt,
    setGeneratedContent,
    setGeneratedImage,
    setUploadedMedia,
    setMaxLength,
    setIncludeHashtags,
    setIncludeKeywords,
    setImagePromptOnly,
    setGenerateWithCaption,
    setGeneratedHashtags,
    setGeneratedKeywords,
    setFinalPost,
    setIsGenerating,
    resetContent,
  };

  return (
    <ContentGeneratorContext.Provider value={value}>
      {children}
    </ContentGeneratorContext.Provider>
  );
};


import React from 'react';
import { Facebook, Instagram, Linkedin, ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassPanel from './GlassPanel';

interface FacebookContentProps {
  platform: 'facebook' | 'instagram' | 'linkedin';
}

export default function FacebookContent({ platform }: FacebookContentProps) {
  const navigate = useNavigate();

  // Platform-specific configurations
  const platformConfig = {
    facebook: {
      icon: Facebook,
      name: 'Facebook',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      description: 'Connect with your audience through engaging Facebook posts'
    },
    instagram: {
      icon: Instagram,
      name: 'Instagram',
      color: 'from-purple-500 via-pink-500 to-orange-400',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      description: 'Share visual stories and connect with your Instagram followers'
    },
    linkedin: {
      icon: Linkedin,
      name: 'LinkedIn',
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-700 dark:text-blue-400',
      description: 'Build your professional network with engaging LinkedIn content'
    }
  };

  const config = platformConfig[platform];
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-bg-alt dark:bg-gray-800 shadow-sm border-b border-border-turquoise dark:border-gray-700 shadow-turquoise sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-text-secondary dark:text-gray-300 hover:text-text dark:hover:text-gray-100 transition-all duration-250 mr-6 hover:bg-bg-secondary dark:hover:bg-gray-700 px-3 py-2 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="flex items-center">
              <div className={`w-8 h-8 bg-gradient-to-r ${config.color} rounded-lg flex items-center justify-center mr-3 shadow-turquoise hover:shadow-turquoise-strong transition-all duration-250 hover:scale-110`}>
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-text dark:text-gray-100 text-glow">{config.name} Content</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-slide-in-top">
          <h2 className="text-3xl font-bold text-text dark:text-gray-100 mb-2 text-glow">
            {config.name} Publishing
          </h2>
          <p className="text-text-secondary dark:text-gray-300">{config.description}</p>
        </div>

        {/* Redirect to Overview Message */}
        <GlassPanel variant="accent" className="animate-fade-in max-w-3xl mx-auto">
          <div className="glass-panel-content text-center py-12">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-primary to-primary-dark rounded-full flex items-center justify-center shadow-turquoise-strong animate-pulse">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-text dark:text-gray-100 mb-4">
              Content Creation Has Moved!
            </h3>
            
            <p className="text-lg text-text-secondary dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              We've simplified content creation! Now you can generate content for all platforms from one unified location on the Overview page.
            </p>

            <div className="bg-bg-secondary dark:bg-gray-700 rounded-lg p-6 mb-6 max-w-xl mx-auto">
              <h4 className="font-semibold text-text dark:text-gray-100 mb-3">How it works:</h4>
              <ol className="text-left text-text-secondary dark:text-gray-300 space-y-2">
                <li className="flex items-start">
                  <span className="font-bold text-primary mr-2">1.</span>
                  <span>Go to the Overview page</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-primary mr-2">2.</span>
                  <span>Use the unified content generator to create your post</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-primary mr-2">3.</span>
                  <span>Select which platforms to publish to (Facebook, Instagram, LinkedIn)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-primary mr-2">4.</span>
                  <span>Publish to multiple platforms at once!</span>
                </li>
              </ol>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="bg-primary hover:bg-primary-dark text-white py-3 px-8 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-turquoise hover:shadow-turquoise-strong focus:ring-2 focus:ring-primary focus:ring-opacity-50 inline-flex items-center space-x-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Go to Overview Page</span>
            </button>
          </div>
        </GlassPanel>

        {/* Platform-Specific Tips */}
        <div className="mt-8 max-w-3xl mx-auto">
          <GlassPanel variant="default" className="animate-slide-in-bottom">
            <div className="glass-panel-content">
              <div className="glass-panel-header">
                <h3 className="glass-panel-title text-lg font-semibold mb-1">
                  {config.name} Publishing Tips
                </h3>
                <p className="glass-panel-subtitle text-sm">
                  Best practices for publishing to {config.name}
                </p>
              </div>
              
              <div className="space-y-3 mt-4">
                {platform === 'facebook' && (
                  <>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <p className="text-sm text-text dark:text-gray-200">Use engaging visuals to increase post reach and engagement</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <p className="text-sm text-text dark:text-gray-200">Post during peak hours (1-4 PM) for maximum visibility</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <p className="text-sm text-text dark:text-gray-200">Keep your message clear and concise for better engagement</p>
                    </div>
                  </>
                )}
                
                {platform === 'instagram' && (
                  <>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <p className="text-sm text-text dark:text-gray-200">High-quality images are essential for Instagram success</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <p className="text-sm text-text dark:text-gray-200">Use relevant hashtags to reach your target audience</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <p className="text-sm text-text dark:text-gray-200">Maintain a consistent visual style and posting schedule</p>
                    </div>
                  </>
                )}
                
                {platform === 'linkedin' && (
                  <>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <p className="text-sm text-text dark:text-gray-200">Share professional insights and industry knowledge</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <p className="text-sm text-text dark:text-gray-200">Engage with your network through thoughtful comments</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <p className="text-sm text-text dark:text-gray-200">Post business-focused content during weekday work hours</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </GlassPanel>
        </div>
      </main>
    </div>
  );
}

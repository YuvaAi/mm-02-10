import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, BarChart3, Settings, Bell, Mail, Facebook, Instagram, Linkedin, Shield, Target, Activity, Clock, Zap, Globe, Sparkles, Award } from 'lucide-react';
import AnalyticsTab from './AnalyticsTab';
import SocialMediaDebugger from './SocialMediaDebugger';
import HistoryTab from './HistoryTab';
import ServiceLogos from './ServiceLogos';
import { useAuth } from '../Contexts/AuthContext';
import { logOut } from '../firebase/auth';
import GlassPanel from './GlassPanel';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await logOut();
    if (!error) {
      navigate('/login');
    }
  };

  const handleFacebookClick = () => {
    navigate('/facebook-content');
  };

  const handleCredentialsClick = () => {
    navigate('/credential-vault');
  };

  const handleFacebookAdsClick = () => {
    navigate('/facebook-ads');
  };

  const [activeTab, setActiveTab] = useState<'main' | 'analytics' | 'history' | 'debug'>('main');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-bg-alt shadow-sm border-b border-border-turquoise shadow-turquoise sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3 shadow-turquoise hover:shadow-turquoise-strong transition-all duration-250 hover:scale-110">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-text text-glow">MarketMate</h1>
            </div>
            
            <div className="flex items-center space-x-4">
            <button aria-label="Notifications" className="p-2 text-text-secondary hover:text-text transition-all duration-250 rounded-lg hover:bg-bg-secondary hover:shadow-turquoise focus:ring-2 focus:ring-primary focus:ring-opacity-50">
              <Bell className="w-5 h-5 icon-glow" />
            </button>
            <button aria-label="Settings" className="p-2 text-text-secondary hover:text-text transition-all duration-250 rounded-lg hover:bg-bg-secondary hover:shadow-turquoise focus:ring-2 focus:ring-primary focus:ring-opacity-50">
              <Settings className="w-5 h-5 icon-glow" />
            </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-turquoise hover:shadow-turquoise-strong transition-all duration-250 hover:scale-110">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-text">
                  {currentUser?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 sm:mb-8 flex items-center space-x-3">
          <button aria-label="Overview"
            onClick={() => setActiveTab('main')}
            className={`px-6 py-3 rounded-lg text-base font-medium border flex items-center space-x-3 transition-all duration-250 min-w-[140px] ${activeTab === 'main' ? 'bg-bg-alt border-border-turquoise shadow-sm shadow-turquoise text-text' : 'text-text-secondary hover:bg-bg-alt border-border hover:shadow-turquoise'}`}
          >
            <Globe className="w-5 h-5" />
            <span>Overview</span>
          </button>
          <button aria-label="Analytics"
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 rounded-lg text-base font-medium border flex items-center space-x-3 transition-colors min-w-[140px] ${activeTab === 'analytics' ? 'bg-bg-secondary border-border shadow-sm text-text' : 'text-text-secondary hover:bg-bg-secondary border-border'}`}
          >
            <Activity className="w-5 h-5" />
            <span>Analytics</span>
          </button>
          <button aria-label="History"
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-lg text-base font-medium border flex items-center space-x-3 transition-colors min-w-[140px] ${activeTab === 'history' ? 'bg-bg-secondary border-border shadow-sm text-text' : 'text-text-secondary hover:bg-bg-secondary border-border'}`}
          >
            <Clock className="w-5 h-5" />
            <span>History</span>
          </button>
          <button aria-label="Debug"
            onClick={() => setActiveTab('debug')}
            className={`px-6 py-3 rounded-lg text-base font-medium border flex items-center space-x-3 transition-colors min-w-[140px] ${activeTab === 'debug' ? 'bg-bg-secondary border-border shadow-sm text-text' : 'text-text-secondary hover:bg-bg-secondary border-border'}`}
          >
            <Zap className="w-5 h-5" />
            <span>Debug</span>
          </button>
        </div>

        {/* Centered Headline */}
        <div className="text-center mt-6 mb-6">
          <h1 className="text-3xl font-bold text-[#1A3D5C]" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
            Marketing made simple, powerful, and yours.
          </h1>
          <p className="text-lg text-gray-600 mt-2" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
            AI-powered ads that save you time and maximize impact.
          </p>
        </div>

        {activeTab === 'main' && (
                 <div className="space-y-6 sm:space-y-8">
                   {/* Main Cards Row */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
                     {/* Left Section - Social Media Platforms */}
                     <GlassPanel variant="accent" className="animate-slide-in-left">
                       <div className="glass-panel-content">
                         <div className="glass-panel-header">
                           <div className="flex items-center space-x-2 mb-1">
                             <div className="w-5 h-5 bg-primary rounded-lg flex items-center justify-center shadow-turquoise">
                               <Sparkles className="w-3 h-3 text-white" />
                             </div>
                             <h3 className="glass-panel-title text-base font-bold">Content Creation</h3>
                           </div>
                           <p className="glass-panel-subtitle text-xs">Generate and publish content across social media platforms</p>
                         </div>
              <div className="space-y-2">
                <button
                  onClick={handleFacebookClick}
                  className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary-dark text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-turquoise hover:shadow-turquoise-strong focus:ring-3 focus:ring-primary focus:ring-opacity-50"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Facebook Posts</span>
                </button>
                
                <button
                  onClick={handleFacebookAdsClick}
                  className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary-dark text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-turquoise hover:shadow-turquoise-strong focus:ring-3 focus:ring-primary focus:ring-opacity-50"
                >
                  <Target className="w-4 h-4" />
                  <span>Facebook Ads</span>
                </button>
                
                <button
                  onClick={() => navigate('/instagram-content')}
                  className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary-dark text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-turquoise hover:shadow-turquoise-strong focus:ring-3 focus:ring-primary focus:ring-opacity-50"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </button>
                
                <button
                  onClick={() => navigate('/linkedin-content')}
                  className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary-dark text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-turquoise hover:shadow-turquoise-strong focus:ring-3 focus:ring-primary focus:ring-opacity-50"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </button>
                       </div>
                     </div>
                     </GlassPanel>

                     {/* Account Management Section */}
                     <GlassPanel variant="default" className="animate-slide-in-right">
                       <div className="glass-panel-content">
                         <div className="glass-panel-header">
                           <div className="flex items-center space-x-2 mb-1">
                             <div className="w-5 h-5 bg-primary rounded-lg flex items-center justify-center shadow-turquoise">
                               <Shield className="w-3 h-3 text-white" />
                             </div>
                             <h3 className="glass-panel-title text-base font-bold">Account Management</h3>
                           </div>
                           <p className="glass-panel-subtitle text-xs">Securely manage your social media credentials and API keys</p>
                         </div>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mx-auto mb-2 shadow-turquoise hover:shadow-turquoise-strong transition-all duration-300 hover:scale-110">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-text-secondary mb-3 text-xs">
                    Securely manage your social media credentials and API keys in one centralized location.
                  </p>
                </div>
                
                <button
                  onClick={handleCredentialsClick}
                  className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary-dark text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-turquoise hover:shadow-turquoise-strong"
                >
                  <Shield className="w-4 h-4" />
                  <span>Manage Credentials</span>
                </button>
                
                <div className="bg-bg-alt border border-accent rounded-lg p-2 shadow-teal hover:shadow-teal-strong transition-all duration-250">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-accent" />
                    <span className="text-accent text-sm font-medium">Secure & Encrypted</span>
                  </div>
                  <p className="text-text-secondary text-sm mt-1">
                    All credentials are encrypted and stored securely
                  </p>
                </div>
                       </div>
                     </div>
                     </GlassPanel>
                   </div>

                   {/* Service Partners Section */}
                   <div className="mt-6 sm:mt-8">
                     <div className="bg-white rounded-xl py-4">
                       <ServiceLogos />
                     </div>
                   </div>
                 </div>
                 )}

        {activeTab === 'analytics' && (
          <GlassPanel variant="accent" className="animate-fade-in">
            <div className="glass-panel-content">
              <div className="glass-panel-header">
                <h3 className="glass-panel-title text-xl font-bold mb-2">Post Analytics</h3>
                <p className="glass-panel-subtitle">Track performance and engagement across all platforms</p>
              </div>
              <AnalyticsTab />
            </div>
          </GlassPanel>
        )}

        {activeTab === 'history' && (
          <HistoryTab />
        )}

        {activeTab === 'debug' && (
          <GlassPanel variant="accent" className="animate-fade-in">
            <div className="glass-panel-content">
              <div className="glass-panel-header">
                <h3 className="glass-panel-title text-xl font-bold mb-2">Debug Tools</h3>
                <p className="glass-panel-subtitle">Diagnose and troubleshoot social media connections</p>
              </div>
              <SocialMediaDebugger />
            </div>
          </GlassPanel>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
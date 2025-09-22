import React from 'react';
import { BarChart3, Bell, Settings, User, LogOut } from 'lucide-react';

interface HeaderProps {
  user?: {
    email: string;
    displayName?: string;
  };
  onSignOut?: () => void;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onSignOut,
  onNotificationsClick,
  onSettingsClick
}) => {
  return (
    <header className="bg-bg-alt border-b border-border-purple shadow-sm shadow-purple sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center animate-slide-in-left">
            <div className="w-8 h-8 bg-gradient-button rounded-lg flex items-center justify-center mr-3 shadow-purple hover:shadow-purple-strong transition-all duration-250 hover:scale-110">
              <BarChart3 className="w-5 h-5 text-primary-contrast" />
            </div>
            <h1 className="text-xl font-bold text-text text-glow">MarketMate</h1>
          </div>
          
          {/* Navigation and User Actions */}
          <div className="flex items-center space-x-4 animate-slide-in-right">
            {/* Notifications */}
            <button
              onClick={onNotificationsClick}
              className="p-2 text-text-secondary hover:text-text transition-all duration-250 rounded-lg hover:bg-bg-secondary hover:shadow-purple focus:ring-2 focus:ring-primary focus:ring-opacity-50"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 icon-glow" />
            </button>
            
            {/* Settings */}
            <button
              onClick={onSettingsClick}
              className="p-2 text-text-secondary hover:text-text transition-all duration-250 rounded-lg hover:bg-bg-secondary hover:shadow-purple focus:ring-2 focus:ring-primary focus:ring-opacity-50"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 icon-glow" />
            </button>
            
            {/* User Menu */}
            {user && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-button rounded-full flex items-center justify-center shadow-purple hover:shadow-purple-strong transition-all duration-250 hover:scale-110">
                    <User className="w-4 h-4 text-primary-contrast" />
                  </div>
                  <span className="text-text-secondary text-sm hidden sm:block">
                    {user.displayName || user.email}
                  </span>
                </div>
                
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="flex items-center space-x-1 text-error hover:text-red-400 transition-all duration-250 text-sm hover:bg-bg-secondary px-2 py-1 rounded-lg focus:ring-2 focus:ring-error focus:ring-opacity-50"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:block">Sign Out</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
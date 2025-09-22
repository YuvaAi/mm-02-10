import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'purple' | 'accent';
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  variant = 'default',
  hover = true,
  padding = 'lg',
  rounded = 'xl'
}) => {
  const baseClasses = 'glass-panel transition-all duration-300 ease-out';
  
  const variantClasses = {
    default: 'glass-panel-default',
    purple: 'glass-panel-purple',
    accent: 'glass-panel-accent'
  };
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };
  
  const roundedClasses = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    '2xl': 'rounded-[24px]'
  };
  
  const hoverClasses = hover ? 'glass-panel-hover' : '';
  
  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    roundedClasses[rounded],
    hoverClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
};

export default GlassPanel;

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'black' | 'purple' | 'gradient' | 'elevated';
  className?: string;
  onClick?: () => void;
  animated?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'black',
  className = '',
  onClick,
  animated = true
}) => {
  const baseClasses = 'rounded-xl border transition-all duration-250 relative overflow-hidden';
  
  const variantClasses = {
    black: 'bg-bg border-border shadow-md shadow-turquoise hover:shadow-turquoise-strong hover:-translate-y-1',
    purple: 'bg-bg-alt border-border-turquoise shadow-md shadow-black hover:shadow-black hover:-translate-y-1',
    gradient: 'bg-gradient-alt border-border-turquoise shadow-md shadow-turquoise hover:shadow-turquoise-strong hover:-translate-y-1',
    elevated: 'bg-bg-alt border-border-turquoise shadow-xl shadow-turquoise hover:shadow-2xl hover:-translate-y-2'
  };
  
  const interactiveClasses = onClick ? 'cursor-pointer' : '';
  const animationClasses = animated ? 'card-hover-effect' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${interactiveClasses} ${animationClasses} ${className}`;
  
  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient';
}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  children, 
  className = '',
  variant = 'default'
}) => {
  const variantClasses = variant === 'gradient' 
    ? 'bg-gradient-button' 
    : 'bg-bg border-b border-border';
    
  return (
    <div className={`px-6 py-4 ${variantClasses} ${className}`}>
      {children}
    </div>
  );
};

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export const CardBody: React.FC<CardBodyProps> = ({ 
  children, 
  className = '',
  padding = 'md'
}) => {
  const paddingClasses = {
    sm: 'px-4 py-3',
    md: 'px-6 py-4',
    lg: 'px-8 py-6'
  };
  
  return (
    <div className={`${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient';
}

export const CardFooter: React.FC<CardFooterProps> = ({ 
  children, 
  className = '',
  variant = 'default'
}) => {
  const variantClasses = variant === 'gradient' 
    ? 'bg-gradient-alt border-t border-border-purple' 
    : 'bg-bg border-t border-border';
    
  return (
    <div className={`px-6 py-4 ${variantClasses} ${className}`}>
      {children}
    </div>
  );
};

interface CardIconProps {
  icon: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'accent' | 'gradient';
}

export const CardIcon: React.FC<CardIconProps> = ({ 
  icon, 
  className = '',
  variant = 'primary'
}) => {
  const variantClasses = {
    primary: 'bg-primary text-text shadow-turquoise',
    accent: 'bg-accent text-text shadow-teal',
    gradient: 'bg-gradient-button text-text shadow-turquoise'
  };
  
  return (
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${variantClasses[variant]} ${className}`}>
      {icon}
    </div>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CardTitle: React.FC<CardTitleProps> = ({ 
  children, 
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'text-lg font-semibold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-bold'
  };
  
  return (
    <h3 className={`text-text ${sizeClasses[size]} ${className}`}>
      {children}
    </h3>
  );
};

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ 
  children, 
  className = ''
}) => {
  return (
    <p className={`text-text-secondary ${className}`}>
      {children}
    </p>
  );
};

export default Card;
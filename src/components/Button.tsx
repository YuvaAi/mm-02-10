import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'gradient' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  loading = false
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-250 focus:outline-none focus:ring-3 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 relative overflow-hidden btn-ripple';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-md shadow-turquoise hover:shadow-turquoise-strong focus:ring-primary transition-all duration-300',
    secondary: 'bg-bg text-primary border-2 border-primary hover:bg-primary hover:text-white shadow-md hover:shadow-turquoise focus:ring-primary transition-all duration-300',
    accent: 'bg-accent text-white hover:bg-accent-dark shadow-md shadow-turquoise hover:shadow-turquoise-strong focus:ring-accent transition-all duration-300',
    gradient: 'bg-primary text-white hover:bg-primary-dark shadow-md shadow-turquoise hover:shadow-turquoise-strong focus:ring-primary transition-all duration-300',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary transition-all duration-300'
  };
  
  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <div className="loading-spinner mr-2" />
      )}
      {children}
    </button>
  );
};

export default Button;
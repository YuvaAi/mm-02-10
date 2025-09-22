/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#366d74',
          500: '#366d74',
          600: '#2a5a60',
          700: '#366d74',
          800: '#2a5a60',
          900: '#134E4A',
          DEFAULT: '#366d74',
          contrast: '#FFFFFF',
          light: '#4a8a91',
          dark: '#2a5a60'
        },
        accent: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#366d74',
          500: '#366d74',
          600: '#2a5a60',
          700: '#366d74',
          800: '#2a5a60',
          900: '#134E4A',
          DEFAULT: '#366d74',
          contrast: '#FFFFFF',
          light: '#4a8a91',
          dark: '#2a5a60'
        },
        bg: {
          DEFAULT: '#FFFFFF',
          alt: '#FAFAFA',
          secondary: '#F9FAFB',
          tertiary: '#F3F4F6'
        },
        text: {
          DEFAULT: '#1F2937',
          secondary: '#6B7280',
          muted: '#6B7280'
        },
        border: {
          DEFAULT: '#E5E7EB',
          light: '#F3F4F6',
          turquoise: 'rgba(54, 109, 116, 0.3)'
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6'
      },
      spacing: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
        '4xl': '6rem'
      },
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem'
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem'
      },
      backgroundImage: {
        'gradient-main': 'none',
        'gradient-alt': 'none',
        'gradient-button': 'none',
        'gradient-accent': 'none',
        'gradient-reverse': 'none'
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'turquoise': '0 4px 14px 0 rgba(54, 109, 116, 0.3)',
        'turquoise-strong': '0 0 30px rgba(54, 109, 116, 0.6)',
        'teal': '0 4px 14px 0 rgba(74, 138, 145, 0.3)',
        'teal-strong': '0 0 30px rgba(74, 138, 145, 0.6)',
        'black': '0 0 20px rgba(0, 0, 0, 0.8)'
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '350ms'
      },
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal': '1040',
        'popover': '1050',
        'tooltip': '1060'
      }
    },
  },
  plugins: [],
};

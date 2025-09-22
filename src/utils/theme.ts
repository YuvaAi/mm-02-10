// Theme utility functions for MarketMate

export type ThemeMode = 'light' | 'dark';

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

// Default theme configuration
export const defaultTheme: ThemeConfig = {
  primary: '#366d74',
  secondary: '#10B981',
  accent: '#366d74',
  background: '#FFFFFF',
  text: '#1F2937'
};

// Light theme configuration
export const lightTheme: ThemeConfig = {
  primary: '#366d74',
  secondary: '#10B981',
  accent: '#366d74',
  background: '#FFFFFF',
  text: '#1F2937'
};

/**
 * Toggle dark mode by adding/removing 'dark' class on html element
 */
export const toggleDarkMode = (): void => {
  const html = document.documentElement;
  html.classList.toggle('dark');
  
  // Store preference in localStorage
  const isDark = html.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

/**
 * Set theme mode (light or dark)
 */
export const setThemeMode = (mode: ThemeMode): void => {
  const html = document.documentElement;
  
  if (mode === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  
  localStorage.setItem('theme', mode);
};

/**
 * Get current theme mode from localStorage or system preference
 */
export const getThemeMode = (): ThemeMode => {
  // Check localStorage first
  const stored = localStorage.getItem('theme') as ThemeMode;
  if (stored && (stored === 'light' || stored === 'dark')) {
    return stored;
  }
  
  // Fall back to system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
};

/**
 * Initialize theme on app load
 */
export const initializeTheme = (): void => {
  const mode = getThemeMode();
  setThemeMode(mode);
};

/**
 * Override CSS variables programmatically
 */
export const setThemeVariables = (config: Partial<ThemeConfig>): void => {
  const root = document.documentElement;
  
  if (config.primary) {
    root.style.setProperty('--color-primary', config.primary);
  }
  if (config.secondary) {
    root.style.setProperty('--color-secondary', config.secondary);
  }
  if (config.accent) {
    root.style.setProperty('--color-accent', config.accent);
  }
  if (config.background) {
    root.style.setProperty('--color-bg', config.background);
  }
  if (config.text) {
    root.style.setProperty('--color-text', config.text);
  }
};

/**
 * Reset theme to default values
 */
export const resetTheme = (): void => {
  const root = document.documentElement;
  
  // Remove custom overrides
  root.style.removeProperty('--color-primary');
  root.style.removeProperty('--color-secondary');
  root.style.removeProperty('--color-accent');
  root.style.removeProperty('--color-bg');
  root.style.removeProperty('--color-text');
};

/**
 * Get current theme configuration from CSS variables
 */
export const getCurrentTheme = (): ThemeConfig => {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  return {
    primary: computedStyle.getPropertyValue('--color-primary').trim(),
    secondary: computedStyle.getPropertyValue('--color-secondary').trim(),
    accent: computedStyle.getPropertyValue('--color-accent').trim(),
    background: computedStyle.getPropertyValue('--color-bg').trim(),
    text: computedStyle.getPropertyValue('--color-text').trim()
  };
};

/**
 * Listen for system theme changes
 */
export const watchSystemTheme = (callback: (mode: ThemeMode) => void): (() => void) => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    // Only auto-switch if no manual preference is stored
    const stored = localStorage.getItem('theme');
    if (!stored) {
      callback(e.matches ? 'dark' : 'light');
    }
  };
  
  mediaQuery.addEventListener('change', handleChange);
  
  // Return cleanup function
  return () => mediaQuery.removeEventListener('change', handleChange);
};

/**
 * Chart color configuration using theme variables
 */
export const getChartColors = () => ({
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  info: 'var(--color-info)'
});

/**
 * Example usage in React component:
 * 
 * import { toggleDarkMode, setThemeMode, getThemeMode } from '../utils/theme';
 * 
 * const MyComponent = () => {
 *   const [theme, setTheme] = useState(getThemeMode());
 *   
 *   const handleThemeToggle = () => {
 *     toggleDarkMode();
 *     setTheme(getThemeMode());
 *   };
 *   
 *   return (
 *     <button onClick={handleThemeToggle}>
 *       Toggle Theme
 *     </button>
 *   );
 * };
 */


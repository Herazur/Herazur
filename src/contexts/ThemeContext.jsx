import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

const ThemeContext = createContext();

export const THEMES = {
  DARK: 'dark',
  PURPLE: 'purple',
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children, defaultTheme = THEMES.DARK, storageKey = 'vite-ui-theme' }) => {
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem(storageKey);
      return Object.values(THEMES).includes(storedTheme) ? storedTheme : defaultTheme;
    }
    return defaultTheme;
  });

  const getThemeVariables = (themeValue) => {
    const baseVariables = {
      '--radius': '0.5rem',
      '--premium-start': '262.1 83.3% 57.8%',
      '--premium-end': '312.1 83.3% 57.8%',
    };

    const themeVariables = {
      [THEMES.DARK]: {
        '--background': '240 10% 3.9%',
        '--foreground': '0 0% 98%',
        '--card': '240 10% 3.9%',
        '--card-foreground': '0 0% 98%',
        '--popover': '240 10% 3.9%',
        '--popover-foreground': '0 0% 98%',
        '--primary': '262.1 83.3% 57.8%',
        '--primary-foreground': '210 20% 98%',
        '--secondary': '240 3.7% 15.9%',
        '--secondary-foreground': '0 0% 98%',
        '--muted': '240 3.7% 15.9%',
        '--muted-foreground': '215.4 16.3% 56.9%',
        '--accent': '240 3.7% 15.9%',
        '--accent-foreground': '0 0% 98%',
        '--destructive': '0 62.8% 30.6%',
        '--destructive-foreground': '0 0% 98%',
        '--border': '240 3.7% 15.9%',
        '--input': '240 3.7% 15.9%',
        '--ring': '262.1 83.3% 57.8%',
      },
      [THEMES.PURPLE]: {
        '--background': '260 50% 5%',
        '--foreground': '260 20% 98%',
        '--card': '260 40% 12%',
        '--card-foreground': '260 20% 98%',
        '--popover': '260 50% 5%',
        '--popover-foreground': '260 20% 98%',
        '--primary': '250 80% 65%',
        '--primary-foreground': '250 70% 10%',
        '--secondary': '260 40% 20%',
        '--secondary-foreground': '260 20% 98%',
        '--muted': '260 40% 20%',
        '--muted-foreground': '260 15% 65%',
        '--accent': '260 40% 25%',
        '--accent-foreground': '260 20% 98%',
        '--destructive': '0 70% 50%',
        '--destructive-foreground': '0 0% 98%',
        '--border': '260 40% 20%',
        '--input': '260 40% 20%',
        '--ring': '250 80% 65%',
      }
    };
    return { ...baseVariables, ...themeVariables[themeValue] };
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(...Object.values(THEMES));
    root.classList.add(theme);

    const variables = getThemeVariables(theme);
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

  }, [theme]);

  const setTheme = (newTheme) => {
    if(Object.values(THEMES).includes(newTheme)) {
      localStorage.setItem(storageKey, newTheme);
      setThemeState(newTheme);
    }
  };
  
  const value = useMemo(() => ({
    theme,
    setTheme,
    themes: THEMES,
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
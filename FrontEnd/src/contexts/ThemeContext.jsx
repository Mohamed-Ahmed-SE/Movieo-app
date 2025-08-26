import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Default to dark mode
    return true;
  });

  const [isThemeLoading, setIsThemeLoading] = useState(false);

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('fontSize') || 'medium';
  });

  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    const saved = localStorage.getItem('animationsEnabled');
    return saved ? saved === 'true' : true;
  });

  const [imageQuality, setImageQuality] = useState(() => {
    return localStorage.getItem('imageQuality') || 'high';
  });

  const [autoPlay, setAutoPlay] = useState(() => {
    const saved = localStorage.getItem('autoPlay');
    return saved ? saved === 'true' : false;
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? saved === 'true' : true;
  });

  const [contentFilter, setContentFilter] = useState(() => {
    return localStorage.getItem('contentFilter') || 'all';
  });

  const [debugMode, setDebugMode] = useState(() => {
    const saved = localStorage.getItem('debugMode');
    return saved ? saved === 'true' : false;
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Apply font size to document
  useEffect(() => {
    const root = document.documentElement;
    const sizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.fontSize = sizeMap[fontSize] || '16px';
  }, [fontSize]);

  // Apply animation settings
  useEffect(() => {
    const root = document.documentElement;
    if (!animationsEnabled) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }
  }, [animationsEnabled]);

  // Apply debug mode
  useEffect(() => {
    if (debugMode) {
      console.log('Debug mode enabled');
      window.debugMode = true;
    } else {
      window.debugMode = false;
    }
  }, [debugMode]);

  // Save other settings to localStorage
  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('animationsEnabled', animationsEnabled);
  }, [animationsEnabled]);

  useEffect(() => {
    localStorage.setItem('imageQuality', imageQuality);
  }, [imageQuality]);

  useEffect(() => {
    localStorage.setItem('autoPlay', autoPlay);
  }, [autoPlay]);

  useEffect(() => {
    localStorage.setItem('notifications', notifications);
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('contentFilter', contentFilter);
  }, [contentFilter]);

  useEffect(() => {
    localStorage.setItem('debugMode', debugMode);
  }, [debugMode]);

  const toggleTheme = async () => {
    setIsThemeLoading(true);
    
    // Simulate theme transition time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsDarkMode(!isDarkMode);
    setIsThemeLoading(false);
  };

  const value = {
    isDarkMode,
    toggleTheme,
    isThemeLoading,
    fontSize,
    setFontSize,
    animationsEnabled,
    setAnimationsEnabled,
    imageQuality,
    setImageQuality,
    autoPlay,
    setAutoPlay,
    notifications,
    setNotifications,
    contentFilter,
    setContentFilter,
    debugMode,
    setDebugMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { updateUserProfile } from '../services/users';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'tjflow-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();

  const [theme, setThemeState] = useState<Theme>(() => {
    // 1. Check local storage
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY) as Theme | null;
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    // 2. Default strictly to light universally regardless of system prefers-color-scheme
    return 'light';
  });

  const applyTheme = (targetTheme: Theme) => {
    const root = document.documentElement;
    if (targetTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Sync theme from cloud profile if present
  useEffect(() => {
    if (profile?.themePreference && (profile.themePreference === 'light' || profile.themePreference === 'dark')) {
      if (profile.themePreference !== theme) {
        setThemeState(profile.themePreference);
        localStorage.setItem(LOCAL_STORAGE_KEY, profile.themePreference);
      }
    }
  }, [profile?.themePreference]);

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        setThemeState(e.newValue as Theme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(LOCAL_STORAGE_KEY, newTheme);
    if (profile?.uid) {
      updateUserProfile(profile.uid, { themePreference: newTheme }).catch((err) => {
        console.error('Failed to persist theme preference to cloud:', err);
      });
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK_COLORS, LIGHT_COLORS, ThemeMode } from '../utils/theme';

interface ThemeContextType {
  mode: ThemeMode;
  theme: typeof DARK_COLORS;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    // Load persisted theme
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('user_theme');
        if (saved === 'light' || saved === 'dark') {
          setModeState(saved);
        } else {
          // Default to system or dark
          setModeState(systemColorScheme === 'light' ? 'light' : 'dark');
        }
      } catch {
        setModeState('dark');
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem('user_theme', newMode);
  };

  const toggleTheme = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  const theme = mode === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ mode, theme, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

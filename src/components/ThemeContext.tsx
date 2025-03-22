import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  theme: string;
  toggleTheme: () => void;
  themeStyles: {
    backgroundColor: string;
    textColor: string;
    headerColor: string;
    switchTrackColor: { false: string; true: string };
    switchThumbColor: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const lightTheme = {
  backgroundColor: '#ffffff',
  textColor: '#000000',
  headerColor: '#333333',
  switchTrackColor: { false: '#767577', true: '#81b0ff' },
  switchThumbColor: '#f4f3f4',
};

const darkTheme = {
  backgroundColor: '#121212',
  textColor: '#ffffff',
  headerColor: '#cccccc',
  switchTrackColor: { false: '#767577', true: '#81b0ff' },
  switchThumbColor: '#f5dd4b',
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const themeStyles = theme === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeStyles }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
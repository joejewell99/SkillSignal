import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const THEME_MIGRATION_KEY = 'skillsignal-theme-default-dark-v1';

function initialTheme() {
  const storedTheme = localStorage.getItem('skillsignal-theme');
  if (!localStorage.getItem(THEME_MIGRATION_KEY)) {
    localStorage.setItem(THEME_MIGRATION_KEY, 'true');
    return 'dark';
  }
  return storedTheme ?? 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('skillsignal-theme', theme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
}

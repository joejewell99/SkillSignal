import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../state/ThemeContext.jsx';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}>
      <Icon size={18} />
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}

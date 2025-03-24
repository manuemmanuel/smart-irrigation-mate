import React, { createContext, useContext, useState } from 'react';

interface Theme {
  colors: {
    background: string;
    text: string;
  };
}

const lightTheme: Theme = {
  colors: {
    background: '#FFFFFF',
    text: '#000000',
  },
};

const darkTheme: Theme = {
  colors: {
    background: '#1A1A1A',
    text: '#FFFFFF',
  },
};

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: lightTheme,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ theme: isDark ? darkTheme : lightTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext); 
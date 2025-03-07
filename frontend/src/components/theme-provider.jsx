"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeProviderContext = createContext({});

export function ThemeProvider({ children, storageKey = "ui-theme", ...props }) {
  const [theme, setTheme] = useState("light"); // Always light mode

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Ensure only light mode is applied
    root.classList.remove("dark");
    root.classList.add("light");

    // Optional: Remove stored theme preference to avoid future overrides
    localStorage.removeItem(storageKey);
  }, []);

  const value = {
    theme: "light",
    setTheme: () => {}, // Disable theme switching
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

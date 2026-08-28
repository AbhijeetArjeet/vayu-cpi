"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeMode = "dark" | "light";

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  selectedCorridor: string | null;
  setSelectedCorridor: (corridor: string | null) => void;
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  lastUpdated: string;
  setLastUpdated: (ts: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [selectedCorridor, setSelectedCorridor] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const saved = localStorage.getItem("vayu_theme") as ThemeMode | null;
    if (saved) {
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("vayu_theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        selectedCorridor,
        setSelectedCorridor,
        demoMode,
        setDemoMode,
        lastUpdated,
        setLastUpdated,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useVayuTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useVayuTheme must be used within a ThemeProvider");
  }
  return context;
}

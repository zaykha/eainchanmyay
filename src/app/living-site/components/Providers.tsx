"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "styled-components";
import { AppStateProvider } from "@/app/living-site/lib/app-state";
import { GlobalStyle } from "@/app/living-site/styles/global";
import {
  eainChanMyaeDarkTheme,
  eainChanMyaeLightTheme,
} from "@/app/living-site/styles/theme";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  toggle: () => {},
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const theme = mode === "dark" ? eainChanMyaeDarkTheme : eainChanMyaeLightTheme;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("ecm_theme");
    if (stored === "light" || stored === "dark") {
      setMode(stored);
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setMode(media.matches ? "dark" : "light");
  }, []);

  const value = useMemo(
    () => ({
      mode,
      toggle: () => {
        const next = mode === "dark" ? "light" : "dark";
        setMode(next);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("ecm_theme", next);
        }
      },
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <AppStateProvider>
          <GlobalStyle />
          {children}
        </AppStateProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

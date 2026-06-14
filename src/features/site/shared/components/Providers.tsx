"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "styled-components";
import { AppStateProvider } from "@/app/living-site/lib/app-state";
import { DEFAULT_LANGUAGE, isSupportedLanguage, type Language } from "@/app/living-site/lib/i18n-config";
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

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  toggle: () => {},
});

const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("ecm_lang") as Language | null;
    if (isSupportedLanguage(stored)) {
      setLanguageState(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("lang", language);
    document.documentElement.style.setProperty("--font-scale", language === "mm" ? "0.8" : "1");
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ecm_lang", language);
    }
  }, [language]);

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

  const languageValue = useMemo(
    () => ({
      language,
      setLanguage: (lang: Language) => setLanguageState(lang),
    }),
    [language]
  );

  return (
    <ThemeContext.Provider value={value}>
      <LanguageContext.Provider value={languageValue}>
        <ThemeProvider theme={theme}>
          <AppStateProvider>
            <GlobalStyle />
            {children}
          </AppStateProvider>
        </ThemeProvider>
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
}

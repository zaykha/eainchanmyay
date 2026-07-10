"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "styled-components";
import { AppStateProvider } from "@/features/site/shared/lib/app-state";
import { DEFAULT_LANGUAGE, isSupportedLanguage, type Language } from "@/features/site/shared/lib/i18n-config";
import { GlobalStyle } from "@/features/site/shared/styles/global";
import { eainChanMyaeLightTheme } from "@/features/site/shared/styles/theme";

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
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const theme = eainChanMyaeLightTheme;

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
    document.documentElement.style.colorScheme = "light";
    document.body.setAttribute("data-lang", language);
    document.documentElement.style.setProperty("--font-scale", language === "mm" ? "0.8" : "1");
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ecm_lang", language);
      window.localStorage.removeItem("ecm_theme");
    }
  }, [language]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const isEditableElement = (element: Element | null): element is HTMLElement => {
      if (!(element instanceof HTMLElement)) return false;
      if (element.isContentEditable) return true;
      if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) return !element.disabled;
      if (element instanceof HTMLInputElement) {
        const nonTextTypes = new Set(["button", "submit", "reset", "checkbox", "radio", "range", "color", "file", "image", "hidden"]);
        return !element.disabled && !element.readOnly && !nonTextTypes.has(element.type);
      }
      return false;
    };

    const handlePointerDown = (event: PointerEvent | MouseEvent | TouchEvent) => {
      const activeElement = document.activeElement;
      if (!(activeElement instanceof HTMLElement) || !isEditableElement(activeElement)) return;

      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (target === activeElement || activeElement.contains(target) || isEditableElement(target) || target.closest("[contenteditable='true']")) {
        return;
      }

      activeElement.blur();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("touchstart", handlePointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("touchstart", handlePointerDown, true);
    };
  }, []);

  const value = useMemo(
    () => ({
      mode: "light" as const,
      toggle: () => {},
    }),
    []
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

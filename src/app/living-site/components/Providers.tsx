"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider } from "styled-components";
import { AppStateProvider } from "@/app/living-site/lib/app-state";
import { GlobalStyle } from "@/app/living-site/styles/global";
import {
  eainChanMyaeDarkTheme,
  eainChanMyaeLightTheme,
} from "@/app/living-site/styles/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState(eainChanMyaeLightTheme);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateTheme = () => {
      setTheme(media.matches ? eainChanMyaeDarkTheme : eainChanMyaeLightTheme);
    };
    updateTheme();
    if (media.addEventListener) {
      media.addEventListener("change", updateTheme);
    } else {
      media.addListener(updateTheme);
    }
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", updateTheme);
      } else {
        media.removeListener(updateTheme);
      }
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <AppStateProvider>
        <GlobalStyle />
        {children}
      </AppStateProvider>
    </ThemeProvider>
  );
}

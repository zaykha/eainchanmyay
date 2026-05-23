"use client";

import { createGlobalStyle, type DefaultTheme } from "styled-components";

type ThemeProps = { theme?: DefaultTheme };

export const GlobalStyle = createGlobalStyle`
  :root {
    --color-primary: ${(props: ThemeProps) => props.theme!.colors.primary};
    --color-primary-dark: ${(props: ThemeProps) => props.theme!.colors.primaryDark};
    --color-accent: ${(props: ThemeProps) => props.theme!.colors.accent};
    --color-paper: ${(props: ThemeProps) => props.theme!.colors.paper};
    --color-surface: ${(props: ThemeProps) => props.theme!.colors.surface};
    --color-surface-2: ${(props: ThemeProps) => props.theme!.colors.surface2};
    --color-text: ${(props: ThemeProps) => props.theme!.colors.text};
    --color-muted: ${(props: ThemeProps) => props.theme!.colors.muted};
    --color-outline: ${(props: ThemeProps) => props.theme!.colors.outline};
    --color-success: ${(props: ThemeProps) => props.theme!.colors.success};
    --color-warning: ${(props: ThemeProps) => props.theme!.colors.warning};
    --color-danger: ${(props: ThemeProps) => props.theme!.colors.danger};
    --color-sold: ${(props: ThemeProps) => props.theme!.colors.sold};
    --gradient: ${(props: ThemeProps) => props.theme!.gradient};
    --shadow-soft: ${(props: ThemeProps) => props.theme!.shadow};
    --frame-shadow: ${(props: ThemeProps) => props.theme!.frameShadow};
    --radius-md: ${(props: ThemeProps) => props.theme!.radii.md};
    --radius-lg: ${(props: ThemeProps) => props.theme!.radii.lg};
    --font-heading: ${(props: ThemeProps) => props.theme!.fonts.heading};
    --font-body: ${(props: ThemeProps) => props.theme!.fonts.body};
    --font-scale: 1;
  }

  @media (max-width: 720px) {
    :root {
      --font-scale: 0.94;
    }
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-height: 100vh;
    font-family: var(--font-primary), system-ui, -apple-system, sans-serif;
    font-size: calc(1rem * var(--font-scale));
    color: var(--color-text);
    background: var(--body-bg, ${(props: ThemeProps) => props.theme!.background.base},
      ${(props: ThemeProps) => props.theme!.background.sprite},
      ${(props: ThemeProps) => props.theme!.background.texture});
    background-size: var(--body-bg-size, auto, 18px 18px, 16px 16px);
    background-attachment: var(--body-bg-attachment, fixed);
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  img {
    max-width: 100%;
    display: block;
  }

  button,
  input,
  select,
  textarea {
    font-family: inherit;
  }

  h1,
  h2,
  h3,
  h4,
  h5 {
    font-family: var(--font-heading);
    letter-spacing: -0.01em;
  }

`;

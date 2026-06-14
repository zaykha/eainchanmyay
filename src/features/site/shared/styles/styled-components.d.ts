import type { MarketplaceTheme } from "./theme";

declare module "styled-components" {
  export type DefaultTheme = MarketplaceTheme;
}

export {};

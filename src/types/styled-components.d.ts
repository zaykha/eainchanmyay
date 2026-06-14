import "styled-components";
import type { MarketplaceTheme } from "@/features/site/shared/styles/theme";

declare module "styled-components" {
  export type DefaultTheme = MarketplaceTheme;
}

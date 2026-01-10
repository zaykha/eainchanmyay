import "styled-components";
import type { MarketplaceTheme } from "@/app/living-site/styles/theme";

declare module "styled-components" {
  export type DefaultTheme = MarketplaceTheme;
}

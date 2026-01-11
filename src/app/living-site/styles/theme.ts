export type MarketplaceTheme = {
  name: "light" | "dark";
  colors: {
    primary: string;
    primaryDark: string;
    accent: string;
    paper: string;
    surface: string;
    surface2: string;
    text: string;
    muted: string;
    outline: string;
    success: string;
    warning: string;
    danger: string;
    sold: string;
  };
  gradient: string;
  shadow: string;
  frameShadow: string;
  background: {
    base: string;
    texture: string;
    sprite: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  radii: {
    md: string;
    lg: string;
  };
};

export const eainChanMyaeLightTheme: MarketplaceTheme = {
  name: "light",
  colors: {
    primary: "#EB2340",
    primaryDark: "#C81933",
    accent: "#F0576B",
    paper: "#F5F6FA",
    surface: "#FFFFFF",
    surface2: "#EEF1F6",
    text: "#1A2230",
    muted: "#667085",
    outline: "rgba(9, 15, 28, 0.12)",
    success: "#1E9E6F",
    warning: "#B56B00",
    danger: "#C53C49",
    sold: "#EEF1F6",
  },
  gradient: "#EB2340",
  shadow: "0 14px 34px rgba(9, 15, 28, 0.12)",
  frameShadow: "0 0 0 1px rgba(9, 15, 28, 0.18), 6px 6px 0 rgba(9, 15, 28, 0.12)",
  background: {
    base:
      "radial-gradient(circle at 16% 18%, rgba(235, 35, 64, 0.15), transparent 30%), radial-gradient(circle at 78% 12%, rgba(240, 84, 103, 0.12), transparent 28%), #F5F6FA",
    texture:
      "linear-gradient(90deg, rgba(9,15,28,0.05) 1px, transparent 1px), linear-gradient(0deg, rgba(9,15,28,0.05) 1px, transparent 1px)",
    sprite:
      "repeating-linear-gradient(45deg, rgba(235,35,64,0.08), rgba(235,35,64,0.08) 6px, transparent 6px, transparent 12px)",
  },
  fonts: {
    heading: '"Space Grotesk", system-ui, -apple-system, sans-serif',
    body: '"Manrope", system-ui, -apple-system, sans-serif',
  },
  radii: {
    md: "12px",
    lg: "18px",
  },
};

export const eainChanMyaeDarkTheme: MarketplaceTheme = {
  name: "dark",
  colors: {
    primary: "#EB2340",
    primaryDark: "#C81933",
    accent: "#F3B43F",
    paper: "#0B0D12",
    surface: "#111522",
    surface2: "#151A2A",
    text: "#EDEFF5",
    muted: "#A9B0C3",
    outline: "rgba(255, 255, 255, 0.08)",
    success: "#38D996",
    warning: "#F3B43F",
    danger: "#E04B5A",
    sold: "#151A2A",
  },
  gradient: "#EB2340",
  shadow: "0 18px 40px rgba(0,0,0,0.4)",
  frameShadow: "0 0 0 1px rgba(255, 255, 255, 0.1), 6px 6px 0 rgba(0, 0, 0, 0.4)",
  background: {
    base:
      "radial-gradient(circle at 18% 24%, rgba(235, 35, 64, 0.12), transparent 28%), radial-gradient(circle at 78% 16%, rgba(243, 180, 63, 0.1), transparent 26%), #0B0D12",
    texture:
      "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
    sprite:
      "repeating-linear-gradient(45deg, rgba(235,35,64,0.08), rgba(235,35,64,0.08) 6px, transparent 6px, transparent 12px)",
  },
  fonts: {
    heading: '"Space Grotesk", system-ui, -apple-system, sans-serif',
    body: '"Manrope", system-ui, -apple-system, sans-serif',
  },
  radii: {
    md: "12px",
    lg: "18px",
  },
};

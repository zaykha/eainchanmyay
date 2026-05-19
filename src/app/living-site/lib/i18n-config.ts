export type Language = "mm" | "en" | "zh" | "th";

export const DEFAULT_LANGUAGE: Language = "mm";

export const SUPPORTED_LANGUAGES = ["mm", "en", "zh", "th"] as const satisfies readonly Language[];

export function isSupportedLanguage(value: string | null | undefined): value is Language {
  return value === "mm" || value === "en" || value === "zh" || value === "th";
}

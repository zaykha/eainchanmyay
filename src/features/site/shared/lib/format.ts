import { translate } from "@/features/site/shared/lib/i18n";
import type { Language } from "@/features/site/shared/lib/i18n-config";

export function formatCurrency(
  value?: number,
  currency?: string,
  fallbackLabel = "",
  language = "en"
) {
  if (value === undefined || value === null) return fallbackLabel;
  const code = currency?.trim() || "MMK";
  const rounded = Math.round(value);

  if (code.toUpperCase() === "MMK") {
    return formatMmk(rounded, language, code.toUpperCase());
  }

  const locale = language === "mm" ? "my-MM" : language === "zh" ? "zh-CN" : language === "th" ? "th-TH" : "en-US";
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  });
  return `${code.toUpperCase()} ${formatter.format(rounded)}`;
}

export function formatMmk(value: number, language = "en", currencyCode = "MMK") {
  const absValue = Math.abs(value);
  const locale = language === "mm" ? "my-MM" : language === "zh" ? "zh-CN" : language === "th" ? "th-TH" : "en-US";
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  });

  if (absValue >= 100000) {
    const lakhs = value / 100000;
    const decimals = lakhs >= 100 ? 0 : lakhs >= 10 ? 1 : 2;
    const lakhFormatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
    const normalizedLanguage: Language = language === "mm" || language === "zh" || language === "th" ? language : "en";
    const lakhLabel = translate(normalizedLanguage, "currency.lakh") || "Lakh";
    if (language === "mm") {
      return `${currencyCode} ${lakhLabel} ${lakhFormatter.format(lakhs)}`;
    }
    return `${currencyCode} ${lakhFormatter.format(lakhs)} ${lakhLabel}`;
  }

  return `${currencyCode} ${formatter.format(value)}`;
}

"use client";

import { useLanguage } from "@/app/living-site/components/Providers";

export type Language = "mm" | "en" | "zh" | "th";

type Dictionary = Record<string, string>;

const translations: Record<Language, Dictionary> = {
  en: {
    "site.tagline": "Myanmar real estate marketplace",
    // ... (keep existing keys, add new ones below requestSale.error.load)
    "requestSale.steps.contact": "Contact & visibility",
    "requestSale.buyerFacingContact": "Buyer-facing contact",
    "requestSale.publicBadge": "Public",
    "requestSale.chooseContactDescription": "Choose who buyers should contact from the listing detail page.",
    "requestSale.agencyProfileContact": "Use agency profile contact",
    "requestSale.agencyProfileDescription": "Buyers will contact your agency directly. Recommended for agency listings.",
    "requestSale.recommendedBadge": "Recommended",
    "requestSale.customListingContact": "Use custom listing contact",
    "requestSale.customListingDescription": "Use a specific agent or contact person for this property.",
    "requestSale.agencyPreview": "Shown on listing: Agency profile contact will be used.",
    "requestSale.listingContactName": "Listing contact name",
    "requestSale.listingContactPrimaryPhone": "Primary phone number",
    "requestSale.listingContactSecondaryPhone": "Secondary phone number (optional)",
    "requestSale.privateOwnerDetails": "Private owner details",
    "requestSale.internalBadge": "Internal only",
    "requestSale.privateOwnerDescription": "These details are only for agency/admin operations and will not be shown on the public listing.",
    "requestSale.addPrivateOwner": "Add private owner details",
    "requestSale.ownerName": "Owner name (optional)",
    "requestSale.ownerPhone": "Owner phone (optional)",
    "requestSale.ownerPhoneSecondary": "Owner phone secondary (optional)",
    "requestSale.ownerNote": "Internal note (optional)",
    "requestSale.buyerFacingError": "Add the buyer-facing contact details.",
    "requestSale.listingContactNameError": "Listing contact name is required.",
    "requestSale.primaryPhoneError": "Primary phone number is required.",
    // Add more as needed for other languages
    // ... rest of existing keys
  },
  mm: {
    "requestSale.steps.contact": "ဆက်သွယ်ရန်နှင့် မြင်နိုင်မှု",
    // Add MM translations
  },
  // zh, th similarly
};

export function useI18n() {
  const { language } = useLanguage();
  const t = (key: string) => {
    const langDict = translations[language] ?? translations.en;
    return langDict[key] ?? translations.en[key] ?? key;
  };
  return { t, language };
}

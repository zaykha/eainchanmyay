import data from "./myanmar-admin-structured.json";

type StructuredState = {
  pcode?: string;
  name_en: string;
  name_mm?: string | null;
  districts?: {
    pcode?: string;
    name_en: string;
    name_mm?: string | null;
    townships?: { pcode?: string; name_en: string; name_mm?: string | null }[];
  }[];
};

type MyanmarStructured = {
  states?: StructuredState[];
};

const structuredData = data as MyanmarStructured;

const pinnedStateOrder = ["Yangon", "Mandalay", "Nay Pyi Taw"] as const;

export const getStates = () =>
  [...(structuredData.states || [])].sort((left, right) => {
    const leftPinnedIndex = pinnedStateOrder.indexOf(left.name_en as (typeof pinnedStateOrder)[number]);
    const rightPinnedIndex = pinnedStateOrder.indexOf(right.name_en as (typeof pinnedStateOrder)[number]);

    const leftPinned = leftPinnedIndex !== -1;
    const rightPinned = rightPinnedIndex !== -1;

    if (leftPinned && rightPinned) {
      return leftPinnedIndex - rightPinnedIndex;
    }
    if (leftPinned) return -1;
    if (rightPinned) return 1;

    return left.name_en.localeCompare(right.name_en);
  });

export const getDistricts = (stateNameEn: string) => {
  const state = structuredData.states?.find((item) => item.name_en === stateNameEn);
  return state?.districts || [];
};

export const getTownships = (stateNameEn: string, districtNameEn: string) => {
  const state = structuredData.states?.find((item) => item.name_en === stateNameEn);
  const district = state?.districts?.find((item) => item.name_en === districtNameEn);
  return district?.townships || [];
};

function findLocationLabel(value: string) {
  const normalized = value.trim();
  const state = structuredData.states?.find(
    (item) => item.name_en === normalized || item.name_mm === normalized
  );
  if (state) return { en: state.name_en, mm: state.name_mm ?? state.name_en };

  for (const stateItem of structuredData.states || []) {
    const district = stateItem.districts?.find(
      (item) => item.name_en === normalized || item.name_mm === normalized
    );
    if (district) return { en: district.name_en, mm: district.name_mm ?? district.name_en };

    for (const districtItem of stateItem.districts || []) {
      const township = districtItem.townships?.find(
        (item) => item.name_en === normalized || item.name_mm === normalized
      );
      if (township) return { en: township.name_en, mm: township.name_mm ?? township.name_en };
    }
  }

  return null;
}

const mmDirectionalSuffix = new Map<string, string>([
  ["East", "အရှေ့"],
  ["West", "အနောက်"],
  ["North", "မြောက်"],
  ["South", "တောင်"],
]);

function toCompactMyanmarAreaName(value: string) {
  return value
    .replace(/တိုင်းဒေသကြီး$/u, "")
    .replace(/ပြည်နယ်$/u, "")
    .replace(/ပြည်ထောင်စုနယ်မြေ$/u, "")
    .trim();
}

function buildMyanmarDirectionalFallback(value: string) {
  const match = value.trim().match(/^(.+?) \((East|West|North|South)\)$/);
  if (!match) return null;

  const [, baseName, directionEn] = match;
  const baseLabel = findLocationLabel(baseName);
  const directionMm = mmDirectionalSuffix.get(directionEn);
  if (!baseLabel || !directionMm) return null;

  return `${toCompactMyanmarAreaName(baseLabel.mm)} (${directionMm})`;
}

export function translateLocationName(value: string, language: string) {
  const label = findLocationLabel(value);
  if (language === "mm") {
    if (label) {
      if (label.mm !== label.en) return label.mm;
      return buildMyanmarDirectionalFallback(value) ?? label.mm;
    }
    return buildMyanmarDirectionalFallback(value) ?? value;
  }
  if (!label) return value;
  return label.en;
}

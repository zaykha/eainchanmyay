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

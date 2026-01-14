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

export const getStates = () => structuredData.states || [];

export const getDistricts = (stateNameEn: string) => {
  const state = structuredData.states?.find((item) => item.name_en === stateNameEn);
  return state?.districts || [];
};

export const getTownships = (stateNameEn: string, districtNameEn: string) => {
  const state = structuredData.states?.find((item) => item.name_en === stateNameEn);
  const district = state?.districts?.find((item) => item.name_en === districtNameEn);
  return district?.townships || [];
};

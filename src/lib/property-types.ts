export const propertyTypeDefinitions = [
  { value: "land", label: "Land", labelKey: "property.land", group: "residential" },
  { value: "house", label: "House", labelKey: "property.house", group: "residential" },
  { value: "apartment", label: "Apartment", labelKey: "property.apartment", group: "residential" },
  { value: "mini_condo", label: "Mini Condo", labelKey: "property.miniCondo", group: "residential" },
  { value: "condo", label: "Condo", labelKey: "property.condo", group: "residential" },
  { value: "serviced_apartment", label: "Serviced Apartment", labelKey: "property.servicedApartment", group: "residential" },
  { value: "shop", label: "Shop", labelKey: "property.shop", group: "commercial" },
  { value: "office", label: "Office", labelKey: "property.office", group: "commercial" },
  { value: "shop_office", label: "Shop / Office", labelKey: "property.shopOffice", group: "commercial" },
  { value: "hotel", label: "Hotel", labelKey: "property.hotel", group: "commercial" },
  { value: "restaurant", label: "Restaurant", labelKey: "property.restaurant", group: "commercial" },
  { value: "marketplace", label: "Marketplace", labelKey: "property.marketplace", group: "commercial" },
  { value: "warehouse", label: "Warehouse", labelKey: "property.warehouse", group: "industrial" },
  { value: "industrial", label: "Industrial", labelKey: "property.industrial", group: "industrial" },
  { value: "project", label: "Project", labelKey: "property.project", group: "special" },
] as const;

export type PropertyType = (typeof propertyTypeDefinitions)[number]["value"];
export type PropertyTypeGroup = (typeof propertyTypeDefinitions)[number]["group"];

export const propertyTypeValues = propertyTypeDefinitions.map((item) => item.value);
export const propertyTypeSet = new Set<string>(propertyTypeValues);
const bedBathEligiblePropertyTypes = new Set<string>(["house", "apartment", "mini_condo", "condo", "serviced_apartment"]);
const legacyValueAliases = new Map<string, PropertyType>([
  ["house_land", "house"],
  ["commercial", "shop_office"],
  ["hotel_restaurant", "hotel"],
]);

const propertyTypeLabelKeyByValue = new Map<string, string>(
  propertyTypeDefinitions.map((item) => [item.value, item.labelKey])
);

const legacyLabelKeyByValue = new Map<string, string>([
  ["house_land", "property.houseLand"],
  ["commercial", "property.commercial"],
  ["hotel_restaurant", "property.hotelRestaurant"],
]);

export function getPropertyTypeLabelKey(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return propertyTypeLabelKeyByValue.get(normalized) ?? legacyLabelKeyByValue.get(normalized) ?? null;
}

export function formatPropertyTypeValue(
  value: string | null | undefined,
  translate?: (key: string) => string
) {
  const labelKey = getPropertyTypeLabelKey(value);
  if (labelKey && translate) {
    return translate(labelKey);
  }

  if (labelKey && !translate) {
    const definition = propertyTypeDefinitions.find((item) => item.labelKey === labelKey);
    if (definition) return definition.label;
  }

  if (value === "house_land") return "House + Land";
  if (value === "commercial") return "Commercial";
  if (value === "hotel_restaurant") return "Hotel / Restaurant";
  return typeof value === "string" ? value.replace(/_/g, " ") : "";
}

export function normalizeSelectablePropertyType(value: string | null | undefined): PropertyType {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (propertyTypeSet.has(normalized)) {
    return normalized as PropertyType;
  }
  return legacyValueAliases.get(normalized) ?? "house";
}

export function isBedBathPropertyType(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return bedBathEligiblePropertyTypes.has(normalized);
}

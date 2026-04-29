import { propertyTypeValues } from "@/lib/property-types";

export const vendorImportTemplateColumns = [
  "external_id",
  "title",
  "description",
  "deal_type",
  "property_type",
  "status",
  "price",
  "currency",
  "state_region",
  "district",
  "township",
  "city",
  "address_text",
  "bedrooms",
  "bathrooms",
  "area_sqft",
  "has_lift",
  "has_backup_power",
  "backup_power_type",
  "has_parking",
  "latitude",
  "longitude",
  "owner_name",
  "owner_phone",
  "owner_phone_secondary",
  "image_1",
  "image_2",
  "image_3",
] as const;

export const vendorImportRequiredColumns = [
  "title",
  "deal_type",
  "property_type",
  "state_region",
  "township",
] as const;

export type VendorImportTemplateColumn = (typeof vendorImportTemplateColumns)[number];

export const vendorImportTemplateSampleRow: Record<VendorImportTemplateColumn, string> = {
  external_id: "AGENCY-001",
  title: "3 Bedroom Condo near Inya Road",
  description: "Bright corner unit suitable for families.",
  deal_type: "sale",
  property_type: "condo",
  status: "draft",
  price: "350000000",
  currency: "MMK",
  state_region: "Yangon",
  district: "Western",
  township: "Mayangone",
  city: "Yangon",
  address_text: "Inya Road",
  bedrooms: "3",
  bathrooms: "2",
  area_sqft: "1250",
  has_lift: "yes",
  has_backup_power: "yes",
  backup_power_type: "generator",
  has_parking: "yes",
  latitude: "16.8409",
  longitude: "96.1521",
  owner_name: "Agency Desk",
  owner_phone: "09xxxxxxxxx",
  owner_phone_secondary: "09yyyyyyyyy",
  image_1: "front.jpg",
  image_2: "living-room.jpg",
  image_3: "master-bed.jpg",
};

export const vendorImportAllowedDealTypes = new Set(["sale", "rent"]);
export const vendorImportAllowedStatuses = new Set(["draft", "published", "sold", "rented", "archived"]);
export const vendorImportAllowedPropertyTypes = new Set(propertyTypeValues);

export type VendorImportPreviewRow = {
  rowNumber: number;
  title: string;
  dealType: string;
  propertyType: string;
  location: string;
  imageFilenames: string[];
  errors: string[];
};

export type VendorImportRecord = {
  rowNumber: number;
  title: string;
  description: string | null;
  dealType: string;
  propertyType: string;
  status: string;
  price: number | null;
  currency: string;
  stateRegion: string;
  district: string | null;
  township: string;
  city: string | null;
  addressText: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  hasLift: boolean;
  hasBackupPower: boolean;
  backupPowerType: string | null;
  hasParking: boolean;
  latitude: number | null;
  longitude: number | null;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerPhoneSecondary: string | null;
  imageFilenames: string[];
  errors: string[];
};

function normalizeCellValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value).trim();
}

function normalizeHeader(value: unknown) {
  return normalizeCellValue(value).toLowerCase();
}

export function normalizeImportFilename(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .replace(/^\.?\//, "")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .pop()
    ?.toLowerCase() ?? "";
}

function toNullableString(value: string | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}

function toNullableNumber(value: string | undefined) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "true" || normalized === "yes" || normalized === "1";
}

export function toVendorImportRecords(rows: unknown[][]) {
  if (!rows.length) {
    return {
      columns: [] as string[],
      records: [] as VendorImportRecord[],
      missingRequiredColumns: [...vendorImportRequiredColumns],
    };
  }

  const [headerRow, ...bodyRows] = rows;
  const columns = headerRow.map(normalizeHeader);
  const missingRequiredColumns = vendorImportRequiredColumns.filter((column) => !columns.includes(column));

  const records = bodyRows
    .map((row, index) => {
      const record = Object.fromEntries(columns.map((column, columnIndex) => [column, normalizeCellValue(row[columnIndex])])) as Record<
        string,
        string
      >;

      const errors: string[] = [];
      const title = record.title || "";
      const dealType = record.deal_type || "";
      const propertyType = record.property_type || "";
      const status = record.status || "draft";
      const stateRegion = record.state_region || "";
      const township = record.township || "";
      const imageFilenames = [record.image_1, record.image_2, record.image_3]
        .map((value) => normalizeImportFilename(value))
        .filter(Boolean);

      if (!title) errors.push("Missing title");
      if (!dealType) errors.push("Missing deal type");
      if (dealType && !vendorImportAllowedDealTypes.has(dealType)) errors.push("Invalid deal type");
      if (!propertyType) errors.push("Missing property type");
      if (propertyType && !vendorImportAllowedPropertyTypes.has(propertyType)) errors.push("Invalid property type");
      if (!stateRegion) errors.push("Missing state / region");
      if (!township) errors.push("Missing township");
      if (status && !vendorImportAllowedStatuses.has(status)) errors.push("Invalid status");

      const isLand = propertyType === "land";
      const hasBackupPower = isLand ? false : toBoolean(record.has_backup_power);
      const backupPowerType = isLand ? null : toNullableString(record.backup_power_type);
      if (hasBackupPower && !backupPowerType) {
        errors.push("Backup power type is required when backup power is enabled");
      }

      return {
        rowNumber: index + 2,
        title,
        description: toNullableString(record.description),
        dealType,
        propertyType,
        status,
        price: toNullableNumber(record.price),
        currency: toNullableString(record.currency) ?? "MMK",
        stateRegion,
        district: toNullableString(record.district),
        township,
        city: toNullableString(record.city),
        addressText: toNullableString(record.address_text),
        bedrooms: isLand ? null : toNullableNumber(record.bedrooms),
        bathrooms: isLand ? null : toNullableNumber(record.bathrooms),
        areaSqft: toNullableNumber(record.area_sqft),
        hasLift: isLand ? false : toBoolean(record.has_lift),
        hasBackupPower,
        backupPowerType,
        hasParking: isLand ? false : toBoolean(record.has_parking),
        latitude: toNullableNumber(record.latitude),
        longitude: toNullableNumber(record.longitude),
        ownerName: toNullableString(record.owner_name),
        ownerPhone: toNullableString(record.owner_phone),
        ownerPhoneSecondary: toNullableString(record.owner_phone_secondary),
        imageFilenames,
        errors,
      } satisfies VendorImportRecord;
    })
    .filter((row) => row.title || row.dealType || row.propertyType || row.stateRegion || row.imageFilenames.length || row.errors.length);

  return {
    columns,
    records,
    missingRequiredColumns,
  };
}

export function toTemplateRows() {
  return [vendorImportTemplateColumns, vendorImportTemplateColumns.map((column) => vendorImportTemplateSampleRow[column])];
}

export function validateVendorImportRows(rows: unknown[][]) {
  const { columns, records, missingRequiredColumns } = toVendorImportRecords(rows);

  const previewRows = records.map((record) => ({
    rowNumber: record.rowNumber,
    title: record.title,
    dealType: record.dealType,
    propertyType: record.propertyType,
    location: [record.township, record.district, record.stateRegion].filter(Boolean).join(", "),
    imageFilenames: record.imageFilenames,
    errors: record.errors,
  }));

  const invalidRows = previewRows.filter((row) => row.errors.length > 0).length;

  return {
    columns,
    previewRows,
    summary: {
      totalRows: previewRows.length,
      validRows: previewRows.length - invalidRows,
      invalidRows,
    },
    missingRequiredColumns,
  };
}

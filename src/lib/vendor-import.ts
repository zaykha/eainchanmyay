import { getDistricts, getStates, getTownships } from "@/features/site/shared/lib/myanmar-geo";

const maxImagesPerProperty = 10;
export const vendorImportMaxRows = 50;
export const vendorImportMaxZipBytes = 100 * 1024 * 1024;
export const vendorImportRecommendedImageBytes = 5 * 1024 * 1024;

export const vendorImportTemplateColumns = [
  "title",
  "description",
  "deal_type",
  "property_type",
  "price",
  "status",
  "state_region",
  "district",
  "township",
  "location_code",
  "address_text",
  "latitude",
  "longitude",
  "bedrooms",
  "bathrooms",
  "area_sqft",
  "floor_count",
  "room_count",
  "has_lift",
  "has_backup_power",
  "backup_power_type",
  "has_parking",
  "commission_percent",
  "owner_name",
  "owner_phone",
  "owner_phone_secondary",
  "image_file_1",
  "image_file_2",
  "image_file_3",
  "image_file_4",
  "image_file_5",
  "image_file_6",
  "image_file_7",
  "image_file_8",
  "image_file_9",
  "image_file_10",
] as const;

export const vendorImportRequiredColumns = ["title", "deal_type", "property_type", "price"] as const;

export type VendorImportTemplateColumn = (typeof vendorImportTemplateColumns)[number];

export const vendorImportTemplateSampleRow: Record<VendorImportTemplateColumn, string> = {
  title: "Condo in Hlaing",
  description: "Near main road condo unit",
  deal_type: "sale",
  property_type: "condo",
  price: "250000000",
  status: "draft",
  state_region: "Yangon",
  district: "Yangon (West)",
  township: "Hlaing",
  location_code: "MMR013040",
  address_text: "Near main road",
  latitude: "16.8409",
  longitude: "96.1242",
  bedrooms: "2",
  bathrooms: "2",
  area_sqft: "950",
  floor_count: "8",
  room_count: "4",
  has_lift: "yes",
  has_backup_power: "yes",
  backup_power_type: "generator",
  has_parking: "yes",
  commission_percent: "2",
  owner_name: "Daw Mya",
  owner_phone: "09123456789",
  owner_phone_secondary: "",
  image_file_1: "condo-hlaing-1.jpg",
  image_file_2: "condo-hlaing-2.jpg",
  image_file_3: "",
  image_file_4: "",
  image_file_5: "",
  image_file_6: "",
  image_file_7: "",
  image_file_8: "",
  image_file_9: "",
  image_file_10: "",
};

export const vendorImportGuideLines = [
  "Fill listing data in the Properties Upload sheet.",
  "Use dropdown values where available.",
  "Use Excel search or Ctrl+F on the Location Reference sheet to find the correct state_region, district, township, and location_code.",
  "Do not rename the column headers.",
  "Put all property images inside an images folder.",
  "Image file names in the ZIP must match image_file_1 to image_file_10.",
  "Example: image_file_1 = condo-hlaing-1.jpg and ZIP contains images/condo-hlaing-1.jpg.",
  "image_file_1 will become the cover image.",
  "Use unique image names. Avoid generic names like photo1.jpg or image.jpg.",
  "Recommended image size is under 1 MB each.",
  "Maximum 10 images per property.",
] as const;

export const vendorImportAllowedDealTypes = ["sale", "rent"] as const;
export const vendorImportAllowedStatuses = [
  "draft",
  "active",
  "paused",
  "reserved",
  "sold",
  "rented",
  "expired",
  "archived",
  "rejected",
] as const;
export const vendorImportAllowedPropertyTypes = [
  "land",
  "house",
  "apartment",
  "mini_condo",
  "condo",
  "serviced_apartment",
  "shop",
  "office",
  "shop_office",
  "hotel",
  "restaurant",
  "marketplace",
  "warehouse",
  "industrial",
  "project",
  "hotel_restaurant",
  "commercial",
  "house_land",
 ] as const;
export const vendorImportAllowedStateRegions = [
  "Yangon",
  "Mandalay",
  "Naypyidaw",
  "Bago",
  "Ayeyarwady",
  "Sagaing",
  "Magway",
  "Tanintharyi",
  "Mon",
  "Kayin",
  "Kayah",
  "Shan",
  "Kachin",
  "Rakhine",
  "Chin",
] as const;
export const vendorImportAllowedCities = [
  "Yangon",
  "Mandalay",
  "Naypyidaw",
  "Bago",
  "Mawlamyine",
  "Pathein",
  "Taunggyi",
  "Monywa",
  "Magway",
  "Myitkyina",
  "Sittwe",
  "Dawei",
  "Hpa-An",
  "Loikaw",
  "Hakha",
] as const;
export const vendorImportAllowedBooleanValues = ["yes", "no"] as const;
export const vendorImportAllowedBackupPowerTypes = ["generator", "inverter", "solar", "battery", "other"] as const;

const vendorImportAllowedDealTypeSet = new Set(vendorImportAllowedDealTypes);
const vendorImportAllowedStatusSet = new Set(vendorImportAllowedStatuses);
const vendorImportAllowedPropertyTypeSet = new Set(vendorImportAllowedPropertyTypes);
const vendorImportAllowedStateRegionSet = new Set(vendorImportAllowedStateRegions.map((value) => value.toLowerCase()));
const vendorImportAllowedBackupPowerTypeSet = new Set(vendorImportAllowedBackupPowerTypes.map((value) => value.toLowerCase()));

type LocationReferenceEntry = {
  locationCode: string;
  stateRegion: string;
  district: string;
  township: string;
};

const vendorImportLocationReferenceEntries: LocationReferenceEntry[] = getStates().flatMap((state) =>
  getDistricts(state.name_en).flatMap((district) =>
    getTownships(state.name_en, district.name_en).map((township) => ({
      locationCode: township.pcode?.trim() || "",
      stateRegion: state.name_en,
      district: district.name_en,
      township: township.name_en,
    }))
  )
);

const vendorImportLocationCodeMap = new Map(
  vendorImportLocationReferenceEntries
    .filter((entry) => entry.locationCode)
    .map((entry) => [entry.locationCode.toLowerCase(), entry] as const)
);

const vendorImportLocationHierarchySet = new Set(
  vendorImportLocationReferenceEntries.map((entry) => `${entry.stateRegion.toLowerCase()}||${entry.district.toLowerCase()}||${entry.township.toLowerCase()}`)
);

const vendorImportStateDistrictSet = new Set(
  vendorImportLocationReferenceEntries.map((entry) => `${entry.stateRegion.toLowerCase()}||${entry.district.toLowerCase()}`)
);

const allowedImageExtensions = new Set(["jpg", "jpeg", "png", "webp"]);

export type VendorImportFieldIssue = {
  field: string;
  message: string;
};

export type VendorImportPreviewRow = {
  rowNumber: number;
  title: string;
  dealType: string;
  propertyType: string;
  sourceStatus: string;
  importStatus: string;
  location: string;
  imageFilenames: string[];
  fieldErrors: VendorImportFieldIssue[];
  warnings: string[];
};

export type VendorImportRecord = {
  rowNumber: number;
  title: string;
  description: string | null;
  dealType: string;
  propertyType: string;
  sourceStatus: string;
  importStatus: string;
  price: number;
  locationCode: string | null;
  township: string | null;
  addressText: string | null;
  stateRegion: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  floorCount: number | null;
  roomCount: number | null;
  hasLift: boolean | null;
  hasBackupPower: boolean | null;
  backupPowerType: string | null;
  hasParking: boolean | null;
  commissionPercent: number | null;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerPhoneSecondary: string | null;
  verificationStatus: string | null;
  verificationNotes: string | null;
  imageFiles: Array<{
    column: string;
    originalValue: string;
    normalizedFilename: string;
    sortOrder: number;
    isCover: boolean;
  }>;
  fieldErrors: VendorImportFieldIssue[];
  warnings: string[];
};

export type VendorImportValidationResult = {
  columns: string[];
  records: VendorImportRecord[];
  missingRequiredColumns: string[];
  globalErrors: string[];
  summary: {
    totalRows: number;
    validRows: number;
    warningRows: number;
    errorRows: number;
  };
  previewRows: VendorImportPreviewRow[];
};

export function getVendorImportLocationReferenceRows() {
  return [
    ["location_code", "state_region", "district", "township"],
    ...vendorImportLocationReferenceEntries.map((entry) => [
      entry.locationCode,
      entry.stateRegion,
      entry.district,
      entry.township,
    ]),
  ];
}

function normalizeCellValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
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

function toNumber(value: string | undefined) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasSourceValue(value: string | undefined) {
  return (value ?? "").trim() !== "";
}

function toNullableBoolean(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return null;
  if (["true", "yes", "1"].includes(normalized)) return true;
  if (["false", "no", "0"].includes(normalized)) return false;
  return null;
}

function buildImageFiles(record: Record<string, string>) {
  return Array.from({ length: maxImagesPerProperty }, (_, index) => {
    const column = `image_file_${index + 1}`;
    const originalValue = record[column] || "";
    const normalizedFilename = normalizeImportFilename(originalValue);
    return {
      column,
      originalValue,
      normalizedFilename,
      sortOrder: index,
      isCover: index === 0,
    };
  }).filter((item) => item.normalizedFilename);
}

function pushFieldError(list: VendorImportFieldIssue[], field: string, message: string) {
  list.push({ field, message });
}

function hasAllowedImageExtension(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  return allowedImageExtensions.has(extension);
}

export function toVendorImportRecords(rows: unknown[][]): VendorImportValidationResult {
  if (!rows.length) {
    return {
      columns: [],
      records: [],
      missingRequiredColumns: [...vendorImportRequiredColumns],
      globalErrors: [],
      summary: {
        totalRows: 0,
        validRows: 0,
        warningRows: 0,
        errorRows: 0,
      },
      previewRows: [],
    };
  }

  const [headerRow, ...bodyRows] = rows;
  const columns = headerRow.map(normalizeHeader);
  const missingRequiredColumns = vendorImportRequiredColumns.filter((column) => !columns.includes(column));
  const globalErrors: string[] = [];

  const records = bodyRows
    .map((row, index) => {
      const source = Object.fromEntries(
        columns.map((column, columnIndex) => [column, normalizeCellValue(row[columnIndex])])
      ) as Record<string, string>;

      const title = source.title || "";
      const dealType = (source.deal_type || "").trim().toLowerCase();
      const propertyType = (source.property_type || "").trim().toLowerCase();
      const sourceStatus = (source.status || "").trim().toLowerCase();
      const imageFiles = buildImageFiles(source);
      const fieldErrors: VendorImportFieldIssue[] = [];
      const warnings: string[] = [];

      if (!title) pushFieldError(fieldErrors, "title", "title is required.");
      const description = toNullableString(source.description);
      if (!dealType) {
        pushFieldError(fieldErrors, "deal_type", "deal_type is required.");
      } else if (!vendorImportAllowedDealTypeSet.has(dealType as (typeof vendorImportAllowedDealTypes)[number])) {
        pushFieldError(fieldErrors, "deal_type", "deal_type must be sale or rent.");
      }

      if (!propertyType) {
        pushFieldError(fieldErrors, "property_type", "property_type is required.");
      } else if (!vendorImportAllowedPropertyTypeSet.has(propertyType as (typeof vendorImportAllowedPropertyTypes)[number])) {
        pushFieldError(fieldErrors, "property_type", "property_type is not supported.");
      }

      const price = toNumber(source.price);
      if ((source.price || "").trim() === "") {
        pushFieldError(fieldErrors, "price", "price is required.");
      } else if (price === null || price < 0) {
        pushFieldError(fieldErrors, "price", "price must be numeric and greater than or equal to 0.");
      }

      const importStatus = sourceStatus || "draft";

      if (sourceStatus && !vendorImportAllowedStatusSet.has(sourceStatus as (typeof vendorImportAllowedStatuses)[number])) {
        pushFieldError(fieldErrors, "status", "status must use a supported listing lifecycle value.");
      }

      const stateRegion = toNullableString(source.state_region);
      if (stateRegion && !vendorImportAllowedStateRegionSet.has(stateRegion.toLowerCase())) {
        pushFieldError(fieldErrors, "state_region", "state_region must use a supported template value.");
      }

      const district = toNullableString(source.district);
      const township = toNullableString(source.township);
      const locationCode = toNullableString(source.location_code);

      const locationFromCode = locationCode ? vendorImportLocationCodeMap.get(locationCode.toLowerCase()) ?? null : null;
      if (locationCode && !locationFromCode) {
        pushFieldError(fieldErrors, "location_code", "location_code was not found in the Location Reference sheet.");
      }

      if (locationFromCode) {
        if (stateRegion && stateRegion.toLowerCase() !== locationFromCode.stateRegion.toLowerCase()) {
          pushFieldError(fieldErrors, "state_region", "state_region does not match the provided location_code.");
        }
        if (district && district.toLowerCase() !== locationFromCode.district.toLowerCase()) {
          pushFieldError(fieldErrors, "district", "district does not match the provided location_code.");
        }
        if (township && township.toLowerCase() !== locationFromCode.township.toLowerCase()) {
          pushFieldError(fieldErrors, "township", "township does not match the provided location_code.");
        }
      }

      const resolvedStateRegion = locationFromCode?.stateRegion ?? stateRegion;
      const resolvedDistrict = locationFromCode?.district ?? district;
      const resolvedTownship = locationFromCode?.township ?? township;

      if (resolvedDistrict && !resolvedStateRegion) {
        pushFieldError(fieldErrors, "state_region", "state_region is required when district is provided.");
      }
      if (resolvedTownship && !resolvedDistrict) {
        pushFieldError(fieldErrors, "district", "district is required when township is provided.");
      }
      if (resolvedTownship && !resolvedStateRegion) {
        pushFieldError(fieldErrors, "state_region", "state_region is required when township is provided.");
      }

      if (resolvedStateRegion && resolvedDistrict) {
        const stateDistrictKey = `${resolvedStateRegion.toLowerCase()}||${resolvedDistrict.toLowerCase()}`;
        if (!vendorImportStateDistrictSet.has(stateDistrictKey)) {
          pushFieldError(fieldErrors, "district", "district does not belong to the selected state_region.");
        }
      }

      if (resolvedStateRegion && resolvedDistrict && resolvedTownship) {
        const hierarchyKey = `${resolvedStateRegion.toLowerCase()}||${resolvedDistrict.toLowerCase()}||${resolvedTownship.toLowerCase()}`;
        if (!vendorImportLocationHierarchySet.has(hierarchyKey)) {
          pushFieldError(fieldErrors, "township", "township does not belong to the selected district.");
        }
      }

      const commissionPercent = toNumber(source.commission_percent);
      if ((source.commission_percent || "").trim() && (commissionPercent === null || commissionPercent < 0 || commissionPercent > 100)) {
        pushFieldError(fieldErrors, "commission_percent", "commission_percent must be between 0 and 100.");
      }

      const latitude = toNumber(source.latitude);
      if ((source.latitude || "").trim() && latitude === null) {
        pushFieldError(fieldErrors, "latitude", "latitude must be a valid number.");
      }

      const longitude = toNumber(source.longitude);
      if ((source.longitude || "").trim() && longitude === null) {
        pushFieldError(fieldErrors, "longitude", "longitude must be a valid number.");
      }

      const optionalNumericFields = [
        ["bedrooms", toNumber(source.bedrooms)],
        ["bathrooms", toNumber(source.bathrooms)],
        ["area_sqft", toNumber(source.area_sqft)],
        ["floor_count", toNumber(source.floor_count)],
        ["room_count", toNumber(source.room_count)],
      ] as const;

      for (const [field, value] of optionalNumericFields) {
        if (hasSourceValue(source[field]) && value === null) {
          pushFieldError(fieldErrors, field, `${field} must be a valid number.`);
        } else if (value !== null && value < 0) {
          pushFieldError(fieldErrors, field, `${field} must be greater than or equal to 0.`);
        }
      }

      const booleanFields = [
        ["has_lift", toNullableBoolean(source.has_lift)],
        ["has_backup_power", toNullableBoolean(source.has_backup_power)],
        ["has_parking", toNullableBoolean(source.has_parking)],
      ] as const;

      for (const [field, value] of booleanFields) {
        if ((source[field] || "").trim() && value === null) {
          pushFieldError(fieldErrors, field, `${field} must be yes/no, true/false, or 1/0.`);
        }
      }

      const backupPowerType = toNullableString(source.backup_power_type);
      if (backupPowerType && !vendorImportAllowedBackupPowerTypeSet.has(backupPowerType.toLowerCase())) {
        pushFieldError(fieldErrors, "backup_power_type", "backup_power_type must use a supported template value.");
      }

      if (backupPowerType && toNullableBoolean(source.has_backup_power) !== true) {
        pushFieldError(fieldErrors, "backup_power_type", "backup_power_type should only be filled when has_backup_power is yes.");
      }

      if (propertyType === "land") {
        const disallowedLandFields: Array<[string, string | null]> = [
          ["bedrooms", source.bedrooms ?? ""],
          ["bathrooms", source.bathrooms ?? ""],
          ["floor_count", source.floor_count ?? ""],
          ["room_count", source.room_count ?? ""],
          ["has_lift", source.has_lift ?? ""],
        ];

        for (const [field, rawValue] of disallowedLandFields) {
          if (hasSourceValue(rawValue ?? "")) {
            pushFieldError(fieldErrors, field, `${field} should be empty when property_type is land.`);
          }
        }
      }

      if (imageFiles.length > maxImagesPerProperty) {
        pushFieldError(fieldErrors, "images", `A maximum of ${maxImagesPerProperty} images is allowed per property.`);
      }

      const duplicateRowFilenames = imageFiles
        .map((item) => item.normalizedFilename)
        .filter((filename, idx, arr) => arr.indexOf(filename) !== idx);
      if (duplicateRowFilenames.length) {
        pushFieldError(
          fieldErrors,
          "images",
          `Duplicate image references in row: ${Array.from(new Set(duplicateRowFilenames)).join(", ")}.`
        );
      }

      const invalidImageNames = imageFiles
        .map((item) => item.normalizedFilename)
        .filter((filename) => !hasAllowedImageExtension(filename));
      if (invalidImageNames.length) {
        pushFieldError(fieldErrors, "images", `Unsupported image file types: ${Array.from(new Set(invalidImageNames)).join(", ")}.`);
      }

      if (source.verification_status) {
        warnings.push("verification_status is ignored during bulk import.");
      }

      const rowNumber = index + 2;

      return {
        rowNumber,
        title,
        description,
        dealType,
        propertyType,
        sourceStatus: importStatus,
        importStatus,
        price: price ?? 0,
        locationCode: locationFromCode?.locationCode ?? locationCode,
        township: resolvedTownship,
        addressText: toNullableString(source.address_text),
        stateRegion: resolvedStateRegion,
        district: resolvedDistrict,
        latitude,
        longitude,
        bedrooms: toNumber(source.bedrooms),
        bathrooms: toNumber(source.bathrooms),
        areaSqft: toNumber(source.area_sqft),
        floorCount: toNumber(source.floor_count),
        roomCount: toNumber(source.room_count),
        hasLift: toNullableBoolean(source.has_lift),
        hasBackupPower: toNullableBoolean(source.has_backup_power),
        backupPowerType,
        hasParking: toNullableBoolean(source.has_parking),
        commissionPercent,
        ownerName: toNullableString(source.owner_name),
        ownerPhone: toNullableString(source.owner_phone),
        ownerPhoneSecondary: toNullableString(source.owner_phone_secondary),
        verificationStatus: toNullableString(source.verification_status),
        verificationNotes: toNullableString(source.verification_notes),
        imageFiles,
        fieldErrors,
        warnings,
      } satisfies VendorImportRecord;
    })
    .filter((record) => {
      return (
        record.title ||
        record.dealType ||
        record.propertyType ||
        record.price ||
        record.imageFiles.length > 0 ||
        record.fieldErrors.length > 0 ||
        record.warnings.length > 0
      );
    });

  if (records.length > vendorImportMaxRows) {
    globalErrors.push(`Maximum ${vendorImportMaxRows} rows are allowed per upload.`);
  }

  const previewRows = records.map((record) => ({
    rowNumber: record.rowNumber,
    title: record.title,
    dealType: record.dealType,
    propertyType: record.propertyType,
    sourceStatus: record.sourceStatus,
    importStatus: record.importStatus,
    location: [record.township, record.district, record.stateRegion].filter(Boolean).join(", "),
    imageFilenames: record.imageFiles.map((item) => item.normalizedFilename),
    fieldErrors: record.fieldErrors,
    warnings: record.warnings,
  }));

  const summary = previewRows.reduce(
    (acc, row) => {
      if (row.fieldErrors.length) {
        acc.errorRows += 1;
      } else if (row.warnings.length) {
        acc.warningRows += 1;
        acc.validRows += 1;
      } else {
        acc.validRows += 1;
      }
      return acc;
    },
    {
      totalRows: records.length,
      validRows: 0,
      warningRows: 0,
      errorRows: 0,
    }
  );

  return {
    columns,
    records,
    missingRequiredColumns,
    globalErrors,
    summary,
    previewRows,
  };
}

export function toTemplateRows() {
  return [vendorImportTemplateColumns, vendorImportTemplateColumns.map((column) => vendorImportTemplateSampleRow[column])];
}

export function validateVendorImportRows(rows: unknown[][]) {
  return toVendorImportRecords(rows);
}

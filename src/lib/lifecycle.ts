export const listingStatuses = [
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

export const leadStatuses = [
  "new",
  "assigned",
  "contacted",
  "qualified",
  "appointment_scheduled",
  "viewed",
  "negotiation",
  "closed_won",
  "closed_lost",
  "unresponsive",
  "spam",
] as const;

export const appointmentStatuses = [
  "requested",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type ListingStatus = (typeof listingStatuses)[number];
export type LeadStatus = (typeof leadStatuses)[number];
export type AppointmentStatus = (typeof appointmentStatuses)[number];

export const publicListingStatuses: ListingStatus[] = ["active", "reserved"];
export const publicListingQueryStatuses = ["active", "reserved", "published"] as const;

export const listingTransitions: Record<ListingStatus, ListingStatus[]> = {
  draft: ["active", "archived"],
  active: ["paused", "reserved", "sold", "rented", "expired", "archived"],
  paused: ["active", "archived"],
  reserved: ["active", "sold", "rented", "archived"],
  sold: ["archived"],
  rented: ["archived"],
  expired: ["active", "archived"],
  archived: ["draft"],
  rejected: ["draft", "archived"],
};

export const leadTransitions: Record<LeadStatus, LeadStatus[]> = {
  new: ["assigned", "contacted", "unresponsive", "spam"],
  assigned: ["contacted", "unresponsive", "spam"],
  contacted: ["qualified", "appointment_scheduled", "closed_lost", "unresponsive"],
  qualified: ["appointment_scheduled", "negotiation", "closed_lost", "unresponsive"],
  appointment_scheduled: ["viewed", "negotiation", "closed_lost", "unresponsive"],
  viewed: ["negotiation", "closed_won", "closed_lost"],
  negotiation: ["closed_won", "closed_lost", "unresponsive"],
  closed_won: [],
  closed_lost: [],
  unresponsive: ["contacted", "closed_lost"],
  spam: [],
};

export const appointmentTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
};

const listingStatusSet = new Set<string>(listingStatuses);
const leadStatusSet = new Set<string>(leadStatuses);
const appointmentStatusSet = new Set<string>(appointmentStatuses);

const legacyListingStatusMap: Record<string, ListingStatus> = {
  published: "active",
};

const legacyLeadStatusMap: Record<string, LeadStatus> = {
  scheduled: "appointment_scheduled",
  closed: "closed_won",
  lost: "closed_lost",
  new_lead: "new",
  negotiating: "negotiation",
  won: "closed_won",
};

const legacyAppointmentStatusMap: Record<string, AppointmentStatus> = {
  scheduled: "confirmed",
  canceled: "cancelled",
};

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeListingStatus(value: unknown): ListingStatus | null {
  const normalized = normalize(value);
  const mapped = legacyListingStatusMap[normalized] ?? normalized;
  return listingStatusSet.has(mapped) ? (mapped as ListingStatus) : null;
}

export function normalizeLeadStatus(value: unknown): LeadStatus | null {
  const normalized = normalize(value);
  const mapped = legacyLeadStatusMap[normalized] ?? normalized;
  return leadStatusSet.has(mapped) ? (mapped as LeadStatus) : null;
}

export function normalizeAppointmentStatus(value: unknown): AppointmentStatus | null {
  const normalized = normalize(value);
  const mapped = legacyAppointmentStatusMap[normalized] ?? normalized;
  return appointmentStatusSet.has(mapped) ? (mapped as AppointmentStatus) : null;
}

export function canTransitionListingStatus(from: unknown, to: ListingStatus) {
  const current = normalizeListingStatus(from);
  if (!current) return false;
  return listingTransitions[current].includes(to);
}

export function canTransitionLeadStatus(from: unknown, to: LeadStatus) {
  const current = normalizeLeadStatus(from);
  if (!current) return false;
  return current === to || leadTransitions[current].includes(to);
}

export function canTransitionAppointmentStatus(from: unknown, to: AppointmentStatus) {
  const current = normalizeAppointmentStatus(from);
  if (!current) return false;
  return current === to || appointmentTransitions[current].includes(to);
}

export function isPublicListingStatus(value: unknown) {
  const status = normalizeListingStatus(value);
  return status ? publicListingStatuses.includes(status) : false;
}

export function labelizeLifecycle(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return "Unknown";
  return normalized
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

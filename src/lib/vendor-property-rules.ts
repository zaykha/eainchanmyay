import {
  canTransitionListingStatus,
  normalizeListingStatus,
  type ListingStatus,
} from "@/lib/lifecycle";

type PropertyStatusPersistencePayload = Partial<{
  status: ListingStatus;
  published_at: string;
  reserved_at: string;
  closed_at: string;
  archived_at: string;
  rejection_reason: string | null;
}>;

export function canAccessVendorProperty(memberIds: string[], createdBy: string | null | undefined) {
  const normalizedCreatedBy = String(createdBy ?? "").trim();
  return Boolean(normalizedCreatedBy && memberIds.includes(normalizedCreatedBy));
}

export function resolvePropertyStatusUpdate(input: {
  currentStatus: unknown;
  nextStatus: unknown;
  rejectionReason?: string | null | undefined;
  now: string;
}) {
  if (input.nextStatus == null) {
    return { ok: true as const, payload: {} };
  }

  const current = normalizeListingStatus(input.currentStatus) ?? "draft";
  const next = normalizeListingStatus(input.nextStatus);

  if (!next) {
    return { ok: false as const, status: 400, error: "Invalid listing status." };
  }

  if (next !== current && !canTransitionListingStatus(current, next)) {
    return {
      ok: false as const,
      status: 400,
      error: `Cannot change listing status from ${current} to ${next}.`,
    };
  }

  const payload: PropertyStatusPersistencePayload = {
    status: next,
  };

  if (next === "active" && current !== "active") payload.published_at = input.now;
  if (next === "reserved" && current !== "reserved") payload.reserved_at = input.now;
  if ((next === "sold" || next === "rented") && current !== next) payload.closed_at = input.now;
  if (next === "archived" && current !== "archived") payload.archived_at = input.now;

  if (next === "rejected") {
    payload.rejection_reason = input.rejectionReason ?? null;
  } else if (current === "rejected") {
    payload.rejection_reason = null;
  }

  return { ok: true as const, payload };
}

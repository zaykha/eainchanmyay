const PROPERTY_LIFECYCLE_COLUMNS = [
  "published_at",
  "expires_at",
  "reserved_at",
  "closed_at",
  "archived_at",
  "rejection_reason",
] as const;

export function stripUnsupportedPropertyLifecycleFields(payload: Record<string, unknown>) {
  const nextPayload = { ...payload };
  let removed = false;

  for (const column of PROPERTY_LIFECYCLE_COLUMNS) {
    if (column in nextPayload) {
      delete nextPayload[column];
      removed = true;
    }
  }

  return {
    payload: nextPayload,
    removed,
  };
}

export function isMissingPropertyLifecycleColumnError(error: { message?: string | null } | null | undefined) {
  const message = String(error?.message ?? "");
  if (!message.includes("Could not find the")) return false;
  return PROPERTY_LIFECYCLE_COLUMNS.some((column) => message.includes(`'${column}'`));
}

export function isLegacyPropertiesStatusConstraintError(error: { message?: string | null } | null | undefined) {
  const message = String(error?.message ?? "");
  return message.includes("properties_status_check");
}

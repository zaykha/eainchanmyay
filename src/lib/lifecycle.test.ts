import { describe, expect, it } from "vitest";

import {
  canTransitionAppointmentStatus,
  canTransitionLeadStatus,
  canTransitionListingStatus,
  isPublicListingStatus,
  labelizeLifecycle,
  normalizeAppointmentStatus,
  normalizeLeadStatus,
  normalizeListingStatus,
} from "@/lib/lifecycle";

describe("lifecycle helpers", () => {
  it("normalizes canonical and legacy listing statuses", () => {
    expect(normalizeListingStatus(" active ")).toBe("active");
    expect(normalizeListingStatus("published")).toBe("active");
    expect(normalizeListingStatus("unknown")).toBeNull();
  });

  it("normalizes canonical and legacy lead statuses", () => {
    expect(normalizeLeadStatus("scheduled")).toBe("appointment_scheduled");
    expect(normalizeLeadStatus("negotiating")).toBe("negotiation");
    expect(normalizeLeadStatus("won")).toBe("closed_won");
    expect(normalizeLeadStatus("")).toBeNull();
  });

  it("normalizes canonical and legacy appointment statuses", () => {
    expect(normalizeAppointmentStatus("scheduled")).toBe("confirmed");
    expect(normalizeAppointmentStatus("canceled")).toBe("cancelled");
    expect(normalizeAppointmentStatus("invalid")).toBeNull();
  });

  it("allows only configured listing transitions", () => {
    expect(canTransitionListingStatus("draft", "active")).toBe(true);
    expect(canTransitionListingStatus("reserved", "sold")).toBe(true);
    expect(canTransitionListingStatus("sold", "active")).toBe(false);
    expect(canTransitionListingStatus("published", "reserved")).toBe(true);
  });

  it("allows self transitions for leads but not invalid jumps", () => {
    expect(canTransitionLeadStatus("contacted", "contacted")).toBe(true);
    expect(canTransitionLeadStatus("contacted", "qualified")).toBe(true);
    expect(canTransitionLeadStatus("new", "closed_won")).toBe(false);
  });

  it("allows self transitions for appointments but blocks invalid jumps", () => {
    expect(canTransitionAppointmentStatus("confirmed", "confirmed")).toBe(true);
    expect(canTransitionAppointmentStatus("requested", "cancelled")).toBe(true);
    expect(canTransitionAppointmentStatus("requested", "completed")).toBe(false);
  });

  it("recognizes only public listing statuses", () => {
    expect(isPublicListingStatus("active")).toBe(true);
    expect(isPublicListingStatus("reserved")).toBe(true);
    expect(isPublicListingStatus("draft")).toBe(false);
    expect(isPublicListingStatus("published")).toBe(true);
  });

  it("labelizes lifecycle values for display", () => {
    expect(labelizeLifecycle("closed_won")).toBe("Closed Won");
    expect(labelizeLifecycle("  no_show ")).toBe("No Show");
    expect(labelizeLifecycle(null)).toBe("Unknown");
  });
});

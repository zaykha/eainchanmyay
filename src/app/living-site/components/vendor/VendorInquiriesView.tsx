"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { MapPinned, Plus, SearchCheck, Trash2, UserRound, X } from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";
import { CustomSelect } from "@/app/living-site/components/form-controls/CustomSelect";
import { supabase } from "@/app/living-site/lib/supabaseClient";
import { withActiveVendorHeaders } from "@/app/living-site/lib/active-context";
import { useI18n } from "@/app/living-site/lib/i18n";

const Page = styled.div<{ $embedded?: boolean }>`
  display: grid;
  gap: ${(props) => (props.$embedded ? "16px" : "20px")};
  min-height: 0;
  height: 100%;
  align-content: start;
`;

const Header = styled.div`
  display: grid;
  gap: 8px;
`;

const Title = styled.h1<{ $embedded?: boolean }>`
  margin: 0;
  font-size: ${(props) => (props.$embedded ? "1.34rem" : "clamp(1.8rem, 3vw, 2.4rem)")};
  color: ${(props) => (props.$embedded ? "var(--color-text)" : "#f8fafc")};
`;

const Subtitle = styled.p<{ $embedded?: boolean }>`
  margin: 0;
  color: ${(props) => (props.$embedded ? "var(--color-muted)" : "#98a2b3")};
  line-height: 1.6;
  max-width: 860px;
`;

const Empty = styled.div<{ $embedded?: boolean }>`
  border-radius: 24px;
  border: 1px dashed ${(props) => (props.$embedded ? "var(--color-outline)" : "rgba(255, 255, 255, 0.16)")};
  background: ${(props) => (props.$embedded ? "color-mix(in srgb, var(--color-surface-2) 80%, white)" : "rgba(255, 255, 255, 0.02)")};
  padding: 24px;
  color: ${(props) => (props.$embedded ? "var(--color-muted)" : "#97a0b2")};
  line-height: 1.65;
`;

const Notice = styled(Empty)`
  border-style: solid;
`;

const UtilityRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
`;

const Toolbar = styled.div`
  display: grid;
  gap: 12px;
`;

const SearchBar = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) repeat(2, minmax(180px, 0.5fr));
  gap: 12px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Input = styled.input`
  min-height: 44px;
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  padding: 0 14px;
  font: inherit;
`;

const SelectField = styled.div`
  min-width: 180px;
  flex: 1 1 180px;
`;

const TabRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const UtilityActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
`;

const Tab = styled.button<{ $active?: boolean }>`
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid
    ${(props) =>
      props.$active ? "color-mix(in srgb, var(--color-primary) 26%, var(--color-outline))" : "var(--color-outline)"};
  background: ${(props) => (props.$active ? "color-mix(in srgb, var(--color-primary) 10%, white)" : "var(--color-surface)")};
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-text)")};
  font-weight: 700;
  cursor: pointer;
`;

const Shell = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(320px, 0.92fr) minmax(0, 1.08fr);
  align-items: start;
  min-height: 0;
  height: 100%;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    height: auto;
  }
`;

const Panel = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 22px;
  background: color-mix(in srgb, var(--color-surface-2) 82%, white);
  padding: 16px;
  display: grid;
  gap: 14px;
  min-height: 0;
`;

const ScrollPanel = styled(Panel)`
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  grid-template-rows: auto minmax(0, 1fr);
`;

const PanelScrollBody = styled.div`
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
  display: grid;
  gap: 14px;
  align-content: start;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const PanelTitleWrap = styled.div`
  display: grid;
  gap: 4px;
`;

const PanelTitle = styled.h2`
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
`;

const PanelCopy = styled.p`
  margin: 0;
  color: var(--color-muted);
  font-size: 0.86rem;
  line-height: 1.5;
`;

const LeadList = styled.div`
  display: grid;
  gap: 10px;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
`;

const LeadRow = styled.button<{ $active?: boolean }>`
  border: 1px solid
    ${(props) =>
      props.$active ? "color-mix(in srgb, var(--color-primary) 24%, var(--color-outline))" : "var(--color-outline)"};
  border-radius: 18px;
  background: ${(props) => (props.$active ? "color-mix(in srgb, var(--color-primary) 8%, white)" : "var(--color-surface)")};
  padding: 14px;
  display: grid;
  gap: 10px;
  text-align: left;
  cursor: pointer;
  transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-soft);
    border-color: color-mix(in srgb, var(--color-primary) 20%, var(--color-outline));
  }
`;

const LeadTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

const LeadMain = styled.div`
  display: grid;
  gap: 6px;
  min-width: 0;
`;

const LeadTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.95rem;
  line-height: 1.35;
`;

const LeadMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  color: var(--color-muted);
  font-size: 0.8rem;
`;

const LeadUnreadDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--color-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 14%, transparent);
  flex: 0 0 auto;
`;

const LeadSummary = styled.div`
  display: grid;
  gap: 6px;
  color: var(--color-muted);
  font-size: 0.82rem;
`;

const StatusPill = styled.span<{ $status: string }>`
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 0.78rem;
  font-weight: 800;
  background: ${(props) =>
    props.$status === "closed_won"
      ? "rgba(16, 185, 129, 0.14)"
      : props.$status === "closed_lost" || props.$status === "spam"
        ? "rgba(239, 68, 68, 0.12)"
        : props.$status === "qualified" || props.$status === "appointment_scheduled" || props.$status === "viewed"
          ? "rgba(59, 130, 246, 0.12)"
          : props.$status === "contacted" || props.$status === "assigned" || props.$status === "negotiation"
            ? "rgba(245, 158, 11, 0.14)"
            : "color-mix(in srgb, var(--color-surface-2) 88%, white)"};
  color: ${(props) =>
    props.$status === "closed_won"
      ? "#047857"
      : props.$status === "closed_lost" || props.$status === "spam"
        ? "#b91c1c"
        : props.$status === "qualified" || props.$status === "appointment_scheduled" || props.$status === "viewed"
          ? "#1d4ed8"
          : props.$status === "contacted" || props.$status === "assigned" || props.$status === "negotiation"
            ? "#b45309"
            : "var(--color-text)"};
`;

const InlineGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  background: var(--color-surface);
  padding: 12px 14px;
  display: grid;
  gap: 4px;
`;

const SummaryLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const SummaryValue = styled.strong`
  color: var(--color-text);
  font-size: 0.92rem;
  line-height: 1.4;
`;

const Chips = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Chip = styled.span`
  min-height: 32px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 600;
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
`;

const Textarea = styled.textarea`
  min-height: 100px;
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  padding: 12px 14px;
  resize: none;
  overflow-y: auto;
  font: inherit;
`;

const Section = styled.div`
  display: grid;
  gap: 10px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 0.95rem;
  color: var(--color-text);
`;

const Button = styled.button<{ $primary?: boolean }>`
  min-height: 42px;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  border: ${(props) => (props.$primary ? "1px solid rgba(0, 0, 0, 0.12)" : "1px solid var(--color-outline)")};
  background: ${(props) => (props.$primary ? "var(--gradient)" : "var(--color-surface)")};
  color: ${(props) => (props.$primary ? "#fff" : "var(--color-text)")};
  font-weight: 700;
  cursor: pointer;
  box-shadow: ${(props) => (props.$primary ? "var(--frame-shadow)" : "none")};
`;

const NoteList = styled.div`
  display: grid;
  gap: 8px;
`;

const SettingsPanel = styled(Panel)`
  gap: 12px;
  height: 100%;
  min-height: 0;
  align-content: start;
`;

const ToolsLayout = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 0.9fr) minmax(280px, 1.1fr);
  min-height: 0;
  height: 100%;
  align-items: stretch;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    height: auto;
  }
`;

const ToolsScrollSection = styled.div`
  min-height: 0;
  height: 100%;
  max-height: 100%;
  overflow-y: auto;
  padding-right: 4px;
  display: grid;
  gap: 10px;
  align-content: start;
`;

const NoteItem = styled.div`
  border-radius: 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-outline);
  padding: 10px 12px;
  display: grid;
  gap: 6px;
`;

const NoteTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

const IconButton = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 120;
`;

const ModalCard = styled.div`
  width: min(620px, 100%);
  max-height: min(84vh, 760px);
  overflow: hidden;
  border: 1px solid var(--color-outline);
  border-radius: 22px;
  background: color-mix(in srgb, var(--color-surface-2) 92%, white);
  box-shadow: var(--shadow-soft);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 0;
`;

const ModalBody = styled.div`
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  display: grid;
  gap: 12px;
  align-content: start;
`;

const SmallText = styled.div`
  color: var(--color-muted);
  font-size: 0.8rem;
  line-height: 1.5;
`;

type InquiryItem = {
  lead_id: string;
  inquiry_id: string;
  requester_user_id?: string | null;
  status: string;
  source: string;
  routing_score: number | null;
  assigned_member_user_id: string | null;
  assigned_member_name: string | null;
  pipeline_stage: string;
  last_contacted_at: string | null;
  last_activity_at: string | null;
  sla_due_at: string | null;
  deal_type: string | null;
  property_type: string | null;
  state_region: string | null;
  district: string | null;
  township: string | null;
  budget_range: string | null;
  timeline: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  need_parking: boolean | null;
  need_lift: boolean | null;
  need_solar: boolean | null;
  need_generator: boolean | null;
  contact_number: string | null;
  created_at: string | null;
  is_unread?: boolean;
  notes: Array<{
    id: string;
    body: string;
    created_at: string | null;
    author_name: string | null;
  }>;
};

type AssigneeOption = {
  user_id: string;
  role: string;
  full_name: string | null;
  email: string | null;
};

type InquiriesPayload = {
  items?: InquiryItem[];
  assignees?: AssigneeOption[];
  membershipRole?: string;
  templates?: Array<{
    id: string;
    title: string;
    body: string;
    created_at: string | null;
    updated_at: string | null;
  }>;
  error?: string;
};

type InquiryTabKey = "all" | "new" | "unassigned" | "overdue" | "qualified" | "mine";

type VendorInquiriesViewProps = {
  embedded?: boolean;
  hideHeader?: boolean;
  title?: string;
  subtitle?: string;
  vendorId?: string | null;
};

function labelize(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTimeline(value: string | null | undefined) {
  switch (value) {
    case "asap":
      return "ASAP";
    case "1-3":
      return "1 to 3 months";
    case "3-6":
      return "3 to 6 months";
    case "browsing":
      return "Just browsing";
    default:
      return labelize(value);
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function buildRequirementChips(item: InquiryItem) {
  const chips: string[] = [];
  if (item.bedrooms) chips.push(`${item.bedrooms}+ beds`);
  if (item.bathrooms) chips.push(`${item.bathrooms}+ baths`);
  if (item.area_sqft) chips.push(`${item.area_sqft} sqft`);
  if (item.need_parking) chips.push("Needs parking");
  if (item.need_lift) chips.push("Needs lift");
  if (item.need_solar) chips.push("Needs solar");
  if (item.need_generator) chips.push("Needs generator");
  return chips;
}

const statusOptions = [
  { value: "new", label: "New" },
  { value: "assigned", label: "Assigned" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "appointment_scheduled", label: "Appointment scheduled" },
  { value: "viewed", label: "Viewed" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed_won", label: "Closed won" },
  { value: "closed_lost", label: "Closed lost" },
  { value: "unresponsive", label: "Unresponsive" },
  { value: "spam", label: "Spam" },
];

const pipelineStageOptions = statusOptions;

const inboxTabs: Array<{ key: InquiryTabKey; label: string }> = [
  { key: "all", label: "All leads" },
  { key: "new", label: "New" },
  { key: "unassigned", label: "Unassigned" },
  { key: "overdue", label: "Overdue" },
  { key: "qualified", label: "Qualified" },
  { key: "mine", label: "Assigned to me" },
];

function formatStatus(value: string | null | undefined) {
  return statusOptions.find((option) => option.value === value)?.label ?? "New";
}

function formatPipelineStage(value: string | null | undefined) {
  return pipelineStageOptions.find((option) => option.value === value)?.label ?? "New";
}

function formatLocation(item: InquiryItem) {
  return [item.township, item.district, item.state_region].filter(Boolean).join(" / ") || "Location pending";
}

function isOverdue(item: InquiryItem) {
  if (!item.sla_due_at) return false;
  const due = new Date(item.sla_due_at).getTime();
  return !Number.isNaN(due) && due < Date.now() && !["closed_won", "closed_lost", "spam"].includes(item.status);
}

export function VendorInquiriesView({
  embedded = false,
  hideHeader = false,
  title,
  subtitle,
  vendorId = null,
}: VendorInquiriesViewProps = {}) {
  const { authToken, user } = useAppState();
  const { t } = useI18n();
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const [membershipRole, setMembershipRole] = useState<string | null>(null);
  const [templates, setTemplates] = useState<NonNullable<InquiriesPayload["templates"]>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [activeTab, setActiveTab] = useState<InquiryTabKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/vendor/inquiries", {
          headers: withActiveVendorHeaders(
            {
              Authorization: `Bearer ${authToken}`,
            },
            vendorId
          ),
        });
        const payload = (await response.json()) as InquiriesPayload;
        if (!response.ok) {
          throw new Error(payload?.error || t("vendor.inquiries.loadError"));
        }
        if (!cancelled) {
          const nextItems = payload.items ?? [];
          setItems(nextItems);
          setAssignees(payload.assignees ?? []);
          setMembershipRole(payload.membershipRole ?? null);
          setTemplates(payload.templates ?? []);
          setSelectedLeadId((current) => current ?? nextItems[0]?.lead_id ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("vendor.inquiries.loadError"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [authToken, refreshVersion, vendorId]);

  useEffect(() => {
    if (!authToken || !user?.id) return;

    const channel = supabase
      .channel(`vendor-leads-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vendor_inquiry_leads" },
        () => setRefreshVersion((current) => current + 1)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vendor_lead_notes" },
        () => setRefreshVersion((current) => current + 1)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vendor_lead_reads" },
        () => setRefreshVersion((current) => current + 1)
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [authToken, user?.id]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (activeTab === "new" && item.status !== "new") return false;
      if (activeTab === "unassigned" && item.assigned_member_user_id) return false;
      if (activeTab === "overdue" && !isOverdue(item)) return false;
      if (activeTab === "qualified" && item.pipeline_stage !== "qualified" && item.status !== "qualified") return false;
      if (activeTab === "mine" && (!user?.id || item.assigned_member_user_id !== user.id)) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (assigneeFilter === "unassigned" && item.assigned_member_user_id) return false;
      if (assigneeFilter !== "all" && assigneeFilter !== "unassigned" && item.assigned_member_user_id !== assigneeFilter) return false;
      if (!query) return true;

      const haystack = [
        labelize(item.deal_type),
        labelize(item.property_type),
        item.budget_range,
        item.timeline,
        item.assigned_member_name,
        item.state_region,
        item.district,
        item.township,
        ...item.notes.map((note) => note.body),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [activeTab, assigneeFilter, items, searchQuery, statusFilter, user?.id]);

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedLeadId(null);
      return;
    }
    if (!selectedLeadId || !filteredItems.some((item) => item.lead_id === selectedLeadId)) {
      setSelectedLeadId(filteredItems[0].lead_id);
    }
  }, [filteredItems, selectedLeadId]);

  const selectedLead = useMemo(
    () => filteredItems.find((item) => item.lead_id === selectedLeadId) ?? null,
    [filteredItems, selectedLeadId]
  );

  useEffect(() => {
    if (!authToken || !selectedLead?.lead_id || !selectedLead.is_unread) return;

    setItems((current) =>
      current.map((item) => (item.lead_id === selectedLead.lead_id ? { ...item, is_unread: false } : item))
    );

    void fetch("/api/vendor/inquiries/read", {
      method: "POST",
      headers: withActiveVendorHeaders(
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        vendorId
      ),
      body: JSON.stringify({ lead_id: selectedLead.lead_id }),
    }).catch(() => undefined);
  }, [authToken, selectedLead?.is_unread, selectedLead?.lead_id, vendorId]);

  const handleAddNote = async (leadId: string) => {
    if (!authToken) return;
    const body = (noteDrafts[leadId] ?? "").trim();
    if (!body) return;

    setSavingLeadId(leadId);
    setError(null);
    try {
      const response = await fetch("/api/vendor/inquiry-notes", {
        method: "POST",
        headers: withActiveVendorHeaders(
          {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          vendorId
        ),
        body: JSON.stringify({ lead_id: leadId, body }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; note?: InquiryItem["notes"][number] }
        | null;
      if (!response.ok || !payload?.note) {
        throw new Error(payload?.error || "Unable to save note.");
      }

      setItems((current) =>
        current.map((item) =>
          item.lead_id === leadId ? { ...item, notes: [payload.note!, ...item.notes] } : item
        )
      );
      setNoteDrafts((current) => ({ ...current, [leadId]: "" }));
    } catch (noteError) {
      setError(noteError instanceof Error ? noteError.message : t("vendor.inquiries.noteError"));
    } finally {
      setSavingLeadId(null);
    }
  };

  const handleCreateTemplate = async () => {
    if (!authToken || !templateTitle.trim() || !templateBody.trim()) return;
    setCreatingTemplate(true);
    setError(null);
    try {
      const response = await fetch("/api/vendor/message-templates", {
        method: "POST",
        headers: withActiveVendorHeaders(
          {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          vendorId
        ),
        body: JSON.stringify({
          title: templateTitle,
          body: templateBody,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; template?: NonNullable<InquiriesPayload["templates"]>[number] }
        | null;
      if (!response.ok || !payload?.template) {
        throw new Error(payload?.error || t("vendor.inquiries.templateError"));
      }

      setTemplates((current) => [payload.template!, ...current]);
      setTemplateTitle("");
      setTemplateBody("");
    } catch (templateError) {
      setError(templateError instanceof Error ? templateError.message : t("vendor.inquiries.templateError"));
    } finally {
      setCreatingTemplate(false);
    }
  };

  const handleUpdateLead = async (
    leadId: string,
    updates: {
      status?: string;
      pipeline_stage?: string;
      assigned_member_user_id?: string | null;
    }
  ) => {
    if (!authToken) return;
    setSavingLeadId(leadId);
    setError(null);

    const previousItems = items;
    setItems((current) =>
      current.map((item) =>
        item.lead_id === leadId
          ? {
              ...item,
              ...(updates.status ? { status: updates.status } : {}),
              ...(updates.pipeline_stage ? { pipeline_stage: updates.pipeline_stage } : {}),
              ...(updates.assigned_member_user_id !== undefined
                ? {
                    assigned_member_user_id: updates.assigned_member_user_id,
                    assigned_member_name:
                      assignees.find((assignee) => assignee.user_id === updates.assigned_member_user_id)?.full_name ??
                      assignees.find((assignee) => assignee.user_id === updates.assigned_member_user_id)?.email ??
                      null,
                  }
                : {}),
            }
          : item
      )
    );

    try {
      const response = await fetch("/api/vendor/inquiries", {
        method: "PATCH",
        headers: withActiveVendorHeaders(
          {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          vendorId
        ),
        body: JSON.stringify({
          lead_id: leadId,
          ...updates,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || t("vendor.inquiries.updateError"));
      }
    } catch (updateError) {
      setItems(previousItems);
      setError(updateError instanceof Error ? updateError.message : t("vendor.inquiries.updateError"));
    } finally {
      setSavingLeadId(null);
    }
  };

  const handleDeleteNote = async (leadId: string, noteId: string) => {
    if (!authToken) return;
    setSavingLeadId(leadId);
    setError(null);
    try {
      const response = await fetch("/api/vendor/inquiry-notes", {
        method: "DELETE",
        headers: withActiveVendorHeaders(
          {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          vendorId
        ),
        body: JSON.stringify({ note_id: noteId }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || t("vendor.inquiries.deleteNoteError"));
      }
      setItems((current) =>
        current.map((item) =>
          item.lead_id === leadId ? { ...item, notes: item.notes.filter((note) => note.id !== noteId) } : item
        )
      );
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("vendor.inquiries.deleteNoteError"));
    } finally {
      setSavingLeadId(null);
    }
  };

  if (loading) {
    return <LoadingOverlay message={t("vendor.inquiries.loading")} />;
  }

  const canManageTemplates = membershipRole === "owner" || membershipRole === "admin";
  const showEmptyPreview = !error && !items.length;
  const resolvedTitle = title ?? t("account.inquiries");
  const resolvedSubtitle = subtitle ?? "Buyer and renter leads routed into your vendor workspace from the marketplace inquiry flow.";

  return (
    <Page $embedded={embedded}>
      {!hideHeader ? (
        <Header>
          <Title $embedded={embedded}>{resolvedTitle}</Title>
          <Subtitle $embedded={embedded}>{resolvedSubtitle}</Subtitle>
        </Header>
      ) : null}

      {error ? <Notice $embedded={embedded}>{error}</Notice> : null}

      {showEmptyPreview ? (
        <>
          <Toolbar style={{ opacity: 0.72 }}>
            <UtilityRow>
              <TabRow>
                {inboxTabs.map((tab, index) => (
                  <Tab key={tab.key} type="button" $active={index === 0} disabled>
                    {tab.label}
                  </Tab>
                ))}
              </TabRow>
            </UtilityRow>
            <SearchBar style={{ opacity: 0.82 }}>
              <Input value="" placeholder={t("vendor.inquiries.searchPlaceholder")} readOnly />
              <SelectField>
                <CustomSelect id="lead-inbox-preview-status-filter" name="lead-inbox-preview-status-filter" label={t("vendor.inquiries.status")} hideLabel value="all" onChange={() => undefined} disabled>
                  <option value="all">{t("vendor.inquiries.allStatuses")}</option>
                </CustomSelect>
              </SelectField>
              <SelectField>
                <CustomSelect id="lead-inbox-preview-assignee-filter" name="lead-inbox-preview-assignee-filter" label={t("vendor.inquiries.assignee")} hideLabel value="all" onChange={() => undefined} disabled>
                  <option value="all">{t("vendor.inquiries.allAssignees")}</option>
                </CustomSelect>
              </SelectField>
            </SearchBar>
          </Toolbar>

          <Shell style={{ opacity: 0.84 }}>
            <ScrollPanel>
              <PanelHeader>
                <PanelTitleWrap>
                  <PanelTitle>{t("vendor.inquiries.leadQueue")}</PanelTitle>
                </PanelTitleWrap>
              </PanelHeader>
              <PanelScrollBody>
                <Empty $embedded>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--color-text)", fontWeight: 700 }}>
                    <SearchCheck size={16} />
                    <span>{t("vendor.inquiries.leadQueueEmpty")}</span>
                  </div>
                </Empty>
              </PanelScrollBody>
            </ScrollPanel>

            <ScrollPanel>
              <PanelScrollBody>
                <Empty $embedded>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--color-text)", fontWeight: 700 }}>
                    <UserRound size={16} />
                    <span>{t("vendor.inquiries.selectLead")}</span>
                  </div>
                </Empty>
              </PanelScrollBody>
            </ScrollPanel>
          </Shell>
        </>
      ) : null}

      {!!items.length && (
        <>
          {canManageTemplates && settingsOpen ? (
            <ScrollPanel>
              <PanelHeader>
                <PanelTitleWrap>
                  <PanelTitle>Inbox tools</PanelTitle>
                  <PanelCopy>Manage reusable message templates for lead follow-up.</PanelCopy>
                </PanelTitleWrap>
                <Button type="button" onClick={() => setSettingsOpen(false)}>
                  Close tools
                </Button>
              </PanelHeader>
              <PanelScrollBody>
                <ToolsLayout>
                  <SettingsPanel style={{ gridTemplateRows: "auto auto minmax(0, 1fr) auto", overflow: "hidden" }}>
                    <PanelTitleWrap>
                      <PanelTitle>Create template</PanelTitle>
                      <PanelCopy>Write a reusable follow-up message for the team.</PanelCopy>
                    </PanelTitleWrap>
                    <Input
                      value={templateTitle}
                      onChange={(event) => setTemplateTitle(event.target.value)}
                      placeholder="Template title"
                    />
                    <Textarea
                      value={templateBody}
                      onChange={(event) => setTemplateBody(event.target.value)}
                      placeholder="Template message body"
                      style={{ minHeight: 0, height: "100%" }}
                    />
                    <Controls>
                      <Button type="button" $primary onClick={() => void handleCreateTemplate()} disabled={creatingTemplate}>
                        {creatingTemplate ? "Saving template..." : "Save template"}
                      </Button>
                    </Controls>
                  </SettingsPanel>

                  <SettingsPanel style={{ minHeight: 0, overflow: "hidden", gridTemplateRows: "auto minmax(0, 1fr)" }}>
                    <PanelTitleWrap>
                      <PanelTitle>Saved templates</PanelTitle>
                      <PanelCopy>Available for quick insertion when working a lead.</PanelCopy>
                    </PanelTitleWrap>
                    {templates.length ? (
                      <ToolsScrollSection>
                        <NoteList>
                          {templates.map((template) => (
                            <NoteItem key={template.id}>
                              <strong style={{ color: "var(--color-text)" }}>{template.title}</strong>
                              <SmallText>{template.body}</SmallText>
                            </NoteItem>
                          ))}
                        </NoteList>
                      </ToolsScrollSection>
                    ) : (
                      <SmallText>No templates yet.</SmallText>
                    )}
                  </SettingsPanel>
                </ToolsLayout>
              </PanelScrollBody>
            </ScrollPanel>
          ) : (
            <>
              <Toolbar>
                <UtilityRow>
                  <TabRow>
                    {inboxTabs.map((tab) => (
                      <Tab key={tab.key} type="button" $active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}>
                        {tab.label}
                      </Tab>
                    ))}
                  </TabRow>
                </UtilityRow>
                <SearchBar>
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t("vendor.inquiries.searchPlaceholder")}
                  />
                  <SelectField>
                    <CustomSelect
                      id="lead-inbox-status-filter"
                      name="lead-inbox-status-filter"
                      label={t("vendor.inquiries.status")}
                      hideLabel
                      value={statusFilter}
                      onChange={setStatusFilter}
                    >
                      <option value="all">{t("vendor.inquiries.allStatuses")}</option>
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </CustomSelect>
                  </SelectField>
                  <SelectField>
                    <CustomSelect
                      id="lead-inbox-assignee-filter"
                      name="lead-inbox-assignee-filter"
                      label={t("vendor.inquiries.assignee")}
                      hideLabel
                      value={assigneeFilter}
                      onChange={setAssigneeFilter}
                    >
                      <option value="all">{t("vendor.inquiries.allAssignees")}</option>
                      <option value="unassigned">{t("vendor.inquiries.unassigned")}</option>
                      {assignees.map((assignee) => (
                        <option key={assignee.user_id} value={assignee.user_id}>
                          {assignee.full_name || assignee.email || assignee.user_id}
                        </option>
                      ))}
                    </CustomSelect>
                  </SelectField>
                </SearchBar>
              </Toolbar>

              <Shell>
                <ScrollPanel>
                  <PanelHeader>
                    <PanelTitleWrap>
                      <PanelTitle>{t("vendor.inquiries.leadQueue")}</PanelTitle>
                    </PanelTitleWrap>
                  </PanelHeader>
                  <PanelScrollBody>
                    {filteredItems.length ? (
                      <LeadList>
                        {filteredItems.map((item) => (
                          <LeadRow
                            key={item.lead_id}
                            type="button"
                            $active={item.lead_id === selectedLeadId}
                            onClick={() => setSelectedLeadId(item.lead_id)}
                          >
                            <LeadTop>
                              <LeadMain>
                                <LeadTitle>
                                  {labelize(item.deal_type)} {labelize(item.property_type)}
                                </LeadTitle>
                                <LeadMeta>
                                  {item.is_unread ? <LeadUnreadDot aria-hidden="true" /> : null}
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                    <MapPinned size={14} />
                                    {formatLocation(item)}
                                  </span>
                                </LeadMeta>
                              </LeadMain>
                              <StatusPill $status={item.status}>{formatStatus(item.status)}</StatusPill>
                            </LeadTop>
                            <LeadSummary>
                              <span>{t("vendor.inquiries.budget")}: {item.budget_range || t("vendor.inquiries.notSpecified")}</span>
                              <span>{t("vendor.inquiries.assigned")}: {item.assigned_member_name || t("vendor.inquiries.unassigned")}</span>
                              <span>{t("vendor.inquiries.sla")}: {formatDateTime(item.sla_due_at)}</span>
                            </LeadSummary>
                          </LeadRow>
                        ))}
                      </LeadList>
                    ) : (
                      <Empty $embedded>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--color-text)", fontWeight: 700 }}>
                          <SearchCheck size={16} />
                          <span>{t("vendor.inquiries.noMatches")}</span>
                        </div>
                        {t("vendor.inquiries.noMatchesCopy")}
                      </Empty>
                    )}
                  </PanelScrollBody>
                </ScrollPanel>

                <ScrollPanel>
                  {selectedLead ? (
                    <PanelScrollBody>
                      <PanelHeader>
                        <PanelTitleWrap>
                          <PanelTitle>
                            {labelize(selectedLead.deal_type)} {labelize(selectedLead.property_type)}
                          </PanelTitle>
                          <PanelCopy>{formatLocation(selectedLead)}</PanelCopy>
                        </PanelTitleWrap>
                        <StatusPill $status={selectedLead.status}>{formatStatus(selectedLead.status)}</StatusPill>
                      </PanelHeader>

                  <InlineGrid>
                    <SummaryCard>
                    <SummaryLabel>{t("vendor.inquiries.budget")}</SummaryLabel>
                    <SummaryValue>{selectedLead.budget_range || t("vendor.inquiries.notSpecified")}</SummaryValue>
                  </SummaryCard>
                  <SummaryCard>
                      <SummaryLabel>{t("vendor.inquiries.timeline")}</SummaryLabel>
                      <SummaryValue>{formatTimeline(selectedLead.timeline)}</SummaryValue>
                    </SummaryCard>
                  <SummaryCard>
                    <SummaryLabel>{t("vendor.inquiries.assigned")}</SummaryLabel>
                    <SummaryValue>{selectedLead.assigned_member_name || t("vendor.inquiries.unassigned")}</SummaryValue>
                  </SummaryCard>
                  <SummaryCard>
                    <SummaryLabel>{t("vendor.inquiries.contactNumber")}</SummaryLabel>
                    <SummaryValue>{selectedLead.contact_number || t("vendor.inquiries.notProvided")}</SummaryValue>
                  </SummaryCard>
                  <SummaryCard>
                    <SummaryLabel>{t("vendor.inquiries.slaDue")}</SummaryLabel>
                    <SummaryValue>{formatDateTime(selectedLead.sla_due_at)}</SummaryValue>
                    </SummaryCard>
                    <SummaryCard>
                      <SummaryLabel>{t("vendor.inquiries.created")}</SummaryLabel>
                      <SummaryValue>{formatDate(selectedLead.created_at)}</SummaryValue>
                    </SummaryCard>
                    <SummaryCard>
                      <SummaryLabel>{t("vendor.inquiries.lastContacted")}</SummaryLabel>
                      <SummaryValue>{formatDateTime(selectedLead.last_contacted_at)}</SummaryValue>
                    </SummaryCard>
                  </InlineGrid>

                  <Section>
                    <SectionTitle>{t("vendor.inquiries.leadControls")}</SectionTitle>
                    <Controls>
                      <SelectField>
                        <CustomSelect
                          id={`lead-status-${selectedLead.lead_id}`}
                          name={`lead-status-${selectedLead.lead_id}`}
                          label={t("vendor.inquiries.status")}
                          hideLabel
                          value={selectedLead.status}
                          onChange={(value) => void handleUpdateLead(selectedLead.lead_id, { status: value })}
                          disabled={savingLeadId === selectedLead.lead_id}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </CustomSelect>
                      </SelectField>
                      <SelectField>
                        <CustomSelect
                          id={`lead-stage-${selectedLead.lead_id}`}
                          name={`lead-stage-${selectedLead.lead_id}`}
                          label={t("vendor.inquiries.stage")}
                          hideLabel
                          value={selectedLead.pipeline_stage}
                          onChange={(value) => void handleUpdateLead(selectedLead.lead_id, { pipeline_stage: value })}
                          disabled={savingLeadId === selectedLead.lead_id}
                        >
                          {pipelineStageOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </CustomSelect>
                      </SelectField>
                      {membershipRole === "owner" || membershipRole === "admin" ? (
                        <SelectField>
                          <CustomSelect
                            id={`lead-assignee-${selectedLead.lead_id}`}
                            name={`lead-assignee-${selectedLead.lead_id}`}
                            label="Assignee"
                            hideLabel
                            value={selectedLead.assigned_member_user_id ?? ""}
                            onChange={(value) =>
                              void handleUpdateLead(selectedLead.lead_id, {
                                assigned_member_user_id: value || null,
                              })
                            }
                            disabled={savingLeadId === selectedLead.lead_id}
                          >
                            <option value="">{t("vendor.inquiries.unassigned")}</option>
                            {assignees.map((assignee) => (
                              <option key={assignee.user_id} value={assignee.user_id}>
                                {assignee.full_name || assignee.email || assignee.user_id}
                              </option>
                            ))}
                          </CustomSelect>
                        </SelectField>
                      ) : null}
                    </Controls>
                  </Section>

                  {buildRequirementChips(selectedLead).length ? (
                    <Section>
                      <SectionTitle>{t("vendor.inquiries.requirements")}</SectionTitle>
                      <Chips>
                        {buildRequirementChips(selectedLead).map((requirement) => (
                          <Chip key={requirement}>{requirement}</Chip>
                        ))}
                      </Chips>
                    </Section>
                  ) : null}

                  <Section>
                    <SectionHeader>
                      <SectionTitle>{t("vendor.inquiries.internalNotes")}</SectionTitle>
                      <Button type="button" onClick={() => setNoteModalOpen(true)}>
                        <Plus size={15} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
                        {t("vendor.inquiries.addNote")}
                      </Button>
                    </SectionHeader>
                    {selectedLead.notes.length ? (
                      <NoteList>
                        {selectedLead.notes.map((note) => (
                          <NoteItem key={note.id}>
                            <NoteTop>
                              <SmallText>
                                {(note.author_name || t("vendor.inquiries.teamMember")) + " • " + formatDateTime(note.created_at)}
                              </SmallText>
                              <IconButton
                                type="button"
                                onClick={() => void handleDeleteNote(selectedLead.lead_id, note.id)}
                                disabled={savingLeadId === selectedLead.lead_id}
                                aria-label={t("vendor.inquiries.deleteNote")}
                              >
                                <Trash2 size={15} />
                              </IconButton>
                            </NoteTop>
                            <div style={{ color: "var(--color-text)", lineHeight: 1.6 }}>{note.body}</div>
                          </NoteItem>
                        ))}
                      </NoteList>
                    ) : (
                      <SmallText>{t("vendor.inquiries.noNotes")}</SmallText>
                    )}
                  </Section>

                    </PanelScrollBody>
                  ) : (
                    <PanelScrollBody>
                      <Empty $embedded>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--color-text)", fontWeight: 700 }}>
                          <UserRound size={16} />
                          <span>{t("vendor.inquiries.selectLead")}</span>
                        </div>
                        {t("vendor.inquiries.selectLeadCopy")}
                      </Empty>
                    </PanelScrollBody>
                  )}
                </ScrollPanel>
              </Shell>
            </>
          )}
        </>
      )}
      {selectedLead && noteModalOpen ? (
        <ModalOverlay onClick={() => setNoteModalOpen(false)}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <ModalHeader>
              <PanelTitleWrap>
                <PanelTitle>{t("vendor.inquiries.addInternalNote")}</PanelTitle>
                <PanelCopy>{t("vendor.inquiries.addInternalNoteCopy")}</PanelCopy>
              </PanelTitleWrap>
              <IconButton type="button" onClick={() => setNoteModalOpen(false)} aria-label={t("vendor.inquiries.closeNoteModal")}>
                <X size={16} />
              </IconButton>
            </ModalHeader>
            <ModalBody>
              <SelectField>
                <CustomSelect
                  id={`lead-template-modal-${selectedLead.lead_id}`}
                  name={`lead-template-modal-${selectedLead.lead_id}`}
                  label={t("vendor.inquiries.template")}
                  hideLabel
                  value=""
                  onChange={(value) => {
                    const template = templates.find((itemTemplate) => itemTemplate.id === value);
                    if (!template) return;
                    setNoteDrafts((current) => ({
                      ...current,
                      [selectedLead.lead_id]: current[selectedLead.lead_id]
                        ? `${current[selectedLead.lead_id]}\n${template.body}`
                        : template.body,
                    }));
                  }}
                >
                  <option value="">{t("vendor.inquiries.useTemplate")}</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                    </option>
                  ))}
                </CustomSelect>
              </SelectField>
              <Textarea
                value={noteDrafts[selectedLead.lead_id] ?? ""}
                onChange={(event) =>
                  setNoteDrafts((current) => ({ ...current, [selectedLead.lead_id]: event.target.value }))
                }
                placeholder={t("vendor.inquiries.notePlaceholder")}
                style={{ minHeight: 180 }}
              />
              <Controls>
                <Button
                  type="button"
                  $primary
                  onClick={async () => {
                    await handleAddNote(selectedLead.lead_id);
                    setNoteModalOpen(false);
                  }}
                  disabled={savingLeadId === selectedLead.lead_id}
                >
                  Add note
                </Button>
              </Controls>
            </ModalBody>
          </ModalCard>
        </ModalOverlay>
      ) : null}
    </Page>
  );
}

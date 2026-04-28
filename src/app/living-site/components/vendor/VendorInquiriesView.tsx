"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import { MapPinned, SearchCheck } from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";

const Page = styled.div`
  display: grid;
  gap: 20px;
`;

const Header = styled.div`
  display: grid;
  gap: 8px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  color: #f8fafc;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #98a2b3;
  line-height: 1.6;
  max-width: 860px;
`;

const List = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #151b29;
  padding: 18px;
  display: grid;
  gap: 14px;
`;

const Top = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
`;

const Heading = styled.div`
  display: grid;
  gap: 6px;
`;

const Name = styled.div`
  color: #f8fafc;
  font-weight: 700;
  font-size: 1.02rem;
`;

const Meta = styled.div`
  color: #98a2b3;
  font-size: 0.92rem;
  line-height: 1.45;
`;

const StatusPill = styled.span<{ $status: string }>`
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 0.82rem;
  font-weight: 800;
  background: ${(props) =>
    props.$status === "closed"
      ? "rgba(84, 214, 113, 0.16)"
      : props.$status === "lost"
        ? "rgba(255, 113, 144, 0.16)"
        : props.$status === "qualified"
          ? "rgba(111, 155, 255, 0.16)"
          : props.$status === "contacted"
            ? "rgba(255, 210, 92, 0.16)"
            : "rgba(255, 255, 255, 0.08)"};
  color: ${(props) =>
    props.$status === "closed"
      ? "#d6ffe2"
      : props.$status === "lost"
        ? "#ffd8df"
        : props.$status === "qualified"
          ? "#dce8ff"
          : props.$status === "contacted"
            ? "#fff2c7"
            : "#e7edf8"};
`;

const Rows = styled.div`
  display: grid;
  gap: 10px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
`;

const Label = styled.span`
  color: #98a2b3;
`;

const Value = styled.span`
  color: #e7edf8;
  font-weight: 600;
  text-align: right;
`;

const Chips = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Chip = styled.span`
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #d8deea;
  font-size: 0.82rem;
  font-weight: 600;
`;

const Empty = styled.div`
  border-radius: 24px;
  border: 1px dashed rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.02);
  padding: 24px;
  color: #97a0b2;
  line-height: 1.65;
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
`;

const Select = styled.select`
  min-height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #101522;
  color: #f8fafc;
  padding: 0 12px;
`;

const Input = styled.input`
  min-height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #101522;
  color: #f8fafc;
  padding: 0 12px;
`;

const Textarea = styled.textarea`
  min-height: 90px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #101522;
  color: #f8fafc;
  padding: 12px;
  resize: vertical;
`;

const Section = styled.div`
  display: grid;
  gap: 10px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 0.95rem;
  color: #f3f4f6;
`;

const Button = styled.button<{ $primary?: boolean }>`
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  border: ${(props) => (props.$primary ? "none" : "1px solid rgba(255, 255, 255, 0.12)")};
  background: ${(props) =>
    props.$primary ? "linear-gradient(135deg, #ff3d5d 0%, #e91b42 100%)" : "transparent"};
  color: #fff;
  font-weight: 700;
  cursor: pointer;
`;

const NoteList = styled.div`
  display: grid;
  gap: 8px;
`;

const NoteItem = styled.div`
  border-radius: 14px;
  background: #101522;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 10px 12px;
  display: grid;
  gap: 6px;
`;

const SmallText = styled.div`
  color: #9aa4b6;
  font-size: 0.82rem;
  line-height: 1.5;
`;

type InquiryItem = {
  lead_id: string;
  inquiry_id: string;
  status: string;
  source: string;
  routing_score: number | null;
  assigned_member_user_id: string | null;
  assigned_member_name: string | null;
  pipeline_stage: string;
  last_contacted_at: string | null;
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
  created_at: string | null;
  notes: Array<{
    id: string;
    body: string;
    created_at: string | null;
    author_name: string | null;
  }>;
  reminders: Array<{
    id: string;
    assigned_user_id: string | null;
    assigned_name: string | null;
    remind_at: string | null;
    status: string | null;
    note: string | null;
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
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "closed", label: "Closed" },
  { value: "lost", label: "Lost" },
];

const pipelineStageOptions = [
  { value: "new_lead", label: "New Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "negotiating", label: "Negotiating" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

function formatStatus(value: string | null | undefined) {
  return statusOptions.find((option) => option.value === value)?.label ?? "New";
}

function formatPipelineStage(value: string | null | undefined) {
  return pipelineStageOptions.find((option) => option.value === value)?.label ?? "New Lead";
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

export function VendorInquiriesView() {
  const { authToken } = useAppState();
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const [membershipRole, setMembershipRole] = useState<string | null>(null);
  const [templates, setTemplates] = useState<NonNullable<InquiriesPayload["templates"]>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [reminderDrafts, setReminderDrafts] = useState<Record<string, { remindAt: string; note: string; assignedUserId: string }>>({});
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/vendor/inquiries", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const payload = (await response.json()) as InquiriesPayload;
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load inquiries.");
        }
        if (!cancelled) {
          setItems(payload.items ?? []);
          setAssignees(payload.assignees ?? []);
          setMembershipRole(payload.membershipRole ?? null);
          setTemplates(payload.templates ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load inquiries.");
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
  }, [authToken]);

  const handleAddNote = async (leadId: string) => {
    if (!authToken) return;
    const body = (noteDrafts[leadId] ?? "").trim();
    if (!body) return;

    setSavingLeadId(leadId);
    setError(null);
    try {
      const response = await fetch("/api/vendor/inquiry-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
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
      setError(noteError instanceof Error ? noteError.message : "Unable to save note.");
    } finally {
      setSavingLeadId(null);
    }
  };

  const handleAddReminder = async (leadId: string) => {
    if (!authToken) return;
    const draft = reminderDrafts[leadId];
    if (!draft?.remindAt) return;

    setSavingLeadId(leadId);
    setError(null);
    try {
      const response = await fetch("/api/vendor/inquiry-reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          lead_id: leadId,
          remind_at: new Date(draft.remindAt).toISOString(),
          assigned_user_id: draft.assignedUserId || null,
          note: draft.note || null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; reminder?: InquiryItem["reminders"][number] }
        | null;
      if (!response.ok || !payload?.reminder) {
        throw new Error(payload?.error || "Unable to create reminder.");
      }

      setItems((current) =>
        current.map((item) =>
          item.lead_id === leadId ? { ...item, reminders: [...item.reminders, payload.reminder!] } : item
        )
      );
      setReminderDrafts((current) => ({
        ...current,
        [leadId]: { remindAt: "", note: "", assignedUserId: "" },
      }));
    } catch (reminderError) {
      setError(reminderError instanceof Error ? reminderError.message : "Unable to create reminder.");
    } finally {
      setSavingLeadId(null);
    }
  };

  const handleReminderStatus = async (leadId: string, reminderId: string, status: string) => {
    if (!authToken) return;
    setSavingLeadId(leadId);
    setError(null);
    try {
      const response = await fetch("/api/vendor/inquiry-reminders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          reminder_id: reminderId,
          status,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to update reminder.");
      }

      setItems((current) =>
        current.map((item) =>
          item.lead_id === leadId
            ? {
                ...item,
                reminders: item.reminders.map((reminder) =>
                  reminder.id === reminderId ? { ...reminder, status } : reminder
                ),
              }
            : item
        )
      );
    } catch (reminderError) {
      setError(reminderError instanceof Error ? reminderError.message : "Unable to update reminder.");
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: templateTitle,
          body: templateBody,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; template?: NonNullable<InquiriesPayload["templates"]>[number] }
        | null;
      if (!response.ok || !payload?.template) {
        throw new Error(payload?.error || "Unable to create template.");
      }

      setTemplates((current) => [payload.template!, ...current]);
      setTemplateTitle("");
      setTemplateBody("");
    } catch (templateError) {
      setError(templateError instanceof Error ? templateError.message : "Unable to create template.");
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          lead_id: leadId,
          ...updates,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to update inquiry lead.");
      }
    } catch (updateError) {
      setItems(previousItems);
      setError(updateError instanceof Error ? updateError.message : "Unable to update inquiry lead.");
    } finally {
      setSavingLeadId(null);
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading inquiries..." />;
  }

  return (
    <Page>
      <Header>
        <Title>Inquiries</Title>
        <Subtitle>Buyer and renter leads routed into your vendor workspace from the marketplace inquiry flow.</Subtitle>
      </Header>

      {error ? <Empty>{error}</Empty> : null}

      {!error && !items.length ? (
        <Empty>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#e5e7eb", fontWeight: 700 }}>
            <SearchCheck size={16} />
            <span>No inquiry leads yet.</span>
          </div>
          New marketplace inquiries routed to your vendor will appear here.
        </Empty>
      ) : null}

      {!!items.length && (
        <>
          {(membershipRole === "owner" || membershipRole === "admin") && (
            <Card>
              <Section>
                <SectionTitle>Message templates</SectionTitle>
                <SmallText>Templates help your team respond faster and keep follow-ups consistent.</SmallText>
                <Input
                  value={templateTitle}
                  onChange={(event) => setTemplateTitle(event.target.value)}
                  placeholder="Template title"
                />
                <Textarea
                  value={templateBody}
                  onChange={(event) => setTemplateBody(event.target.value)}
                  placeholder="Template message body"
                />
                <Controls>
                  <Button type="button" $primary onClick={() => void handleCreateTemplate()} disabled={creatingTemplate}>
                    {creatingTemplate ? "Saving template..." : "Save template"}
                  </Button>
                </Controls>
                {templates.length ? (
                  <NoteList>
                    {templates.slice(0, 5).map((template) => (
                      <NoteItem key={template.id}>
                        <strong style={{ color: "#f8fafc" }}>{template.title}</strong>
                        <SmallText>{template.body}</SmallText>
                      </NoteItem>
                    ))}
                  </NoteList>
                ) : (
                  <SmallText>No templates yet.</SmallText>
                )}
              </Section>
            </Card>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Chip>{items.length} routed leads</Chip>
            <Chip>{items.filter((item) => item.status === "new").length} new</Chip>
            <Chip>{items.filter((item) => item.assigned_member_user_id).length} assigned</Chip>
            <Chip>{items.filter((item) => item.sla_due_at && new Date(item.sla_due_at).getTime() < Date.now()).length} overdue</Chip>
          </div>

          <List>
            {items.map((item) => {
              const requirements = buildRequirementChips(item);
              const location = [item.township, item.district, item.state_region].filter(Boolean).join(" / ");

              return (
                <Card key={item.lead_id}>
                  <Top>
                    <Heading>
                      <Name>
                        {labelize(item.deal_type)} {labelize(item.property_type)}
                      </Name>
                      <Meta>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <MapPinned size={14} />
                          {location || "Location pending"}
                        </span>
                      </Meta>
                    </Heading>
                    <StatusPill $status={item.status}>{formatStatus(item.status)}</StatusPill>
                  </Top>

                  <Rows>
                    <Row>
                      <Label>Budget</Label>
                      <Value>{item.budget_range || "Not specified"}</Value>
                    </Row>
                    <Row>
                      <Label>Timeline</Label>
                      <Value>{formatTimeline(item.timeline)}</Value>
                    </Row>
                    <Row>
                      <Label>Created</Label>
                      <Value>{formatDate(item.created_at)}</Value>
                    </Row>
                    <Row>
                      <Label>Assigned</Label>
                      <Value>{item.assigned_member_name || "Unassigned"}</Value>
                    </Row>
                    <Row>
                      <Label>Stage</Label>
                      <Value>{formatPipelineStage(item.pipeline_stage)}</Value>
                    </Row>
                    <Row>
                      <Label>SLA due</Label>
                      <Value>{formatDateTime(item.sla_due_at)}</Value>
                    </Row>
                  </Rows>

                  <Controls>
                    <Select
                      value={item.status}
                      onChange={(event) => void handleUpdateLead(item.lead_id, { status: event.target.value })}
                      disabled={savingLeadId === item.lead_id}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>

                    <Select
                      value={item.pipeline_stage}
                      onChange={(event) =>
                        void handleUpdateLead(item.lead_id, { pipeline_stage: event.target.value })
                      }
                      disabled={savingLeadId === item.lead_id}
                    >
                      {pipelineStageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>

                    {membershipRole === "owner" || membershipRole === "admin" ? (
                      <Select
                        value={item.assigned_member_user_id ?? ""}
                        onChange={(event) =>
                          void handleUpdateLead(item.lead_id, {
                            assigned_member_user_id: event.target.value || null,
                          })
                        }
                        disabled={savingLeadId === item.lead_id}
                      >
                        <option value="">Unassigned</option>
                        {assignees.map((assignee) => (
                          <option key={assignee.user_id} value={assignee.user_id}>
                            {assignee.full_name || assignee.email || assignee.user_id}
                          </option>
                        ))}
                      </Select>
                    ) : null}
                    </Controls>

                  {requirements.length ? (
                    <Chips>
                      {requirements.map((requirement) => (
                        <Chip key={requirement}>{requirement}</Chip>
                      ))}
                    </Chips>
                  ) : null}

                  <Section>
                    <SectionTitle>Notes</SectionTitle>
                    <Controls>
                      <Select
                        value=""
                        onChange={(event) => {
                          const template = templates.find((itemTemplate) => itemTemplate.id === event.target.value);
                          if (!template) return;
                          setNoteDrafts((current) => ({
                            ...current,
                            [item.lead_id]: current[item.lead_id]
                              ? `${current[item.lead_id]}\n${template.body}`
                              : template.body,
                          }));
                        }}
                      >
                        <option value="">Use template</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.title}
                          </option>
                        ))}
                      </Select>
                    </Controls>
                    <Textarea
                      value={noteDrafts[item.lead_id] ?? ""}
                      onChange={(event) =>
                        setNoteDrafts((current) => ({ ...current, [item.lead_id]: event.target.value }))
                      }
                      placeholder="Add an internal note for this lead"
                    />
                    <Controls>
                      <Button
                        type="button"
                        $primary
                        onClick={() => void handleAddNote(item.lead_id)}
                        disabled={savingLeadId === item.lead_id}
                      >
                        Add note
                      </Button>
                    </Controls>
                    {item.notes.length ? (
                      <NoteList>
                        {item.notes.slice(0, 3).map((note) => (
                          <NoteItem key={note.id}>
                            <SmallText>
                              {(note.author_name || "Team member") + " • " + formatDateTime(note.created_at)}
                            </SmallText>
                            <div style={{ color: "#e7edf8", lineHeight: 1.6 }}>{note.body}</div>
                          </NoteItem>
                        ))}
                      </NoteList>
                    ) : (
                      <SmallText>No notes yet.</SmallText>
                    )}
                  </Section>

                  <Section>
                    <SectionTitle>Reminders</SectionTitle>
                    <Controls>
                      <Input
                        type="datetime-local"
                        value={reminderDrafts[item.lead_id]?.remindAt ?? ""}
                        onChange={(event) =>
                          setReminderDrafts((current) => ({
                            ...current,
                            [item.lead_id]: {
                              remindAt: event.target.value,
                              note: current[item.lead_id]?.note ?? "",
                              assignedUserId: current[item.lead_id]?.assignedUserId ?? "",
                            },
                          }))
                        }
                      />
                      {(membershipRole === "owner" || membershipRole === "admin") && (
                        <Select
                          value={reminderDrafts[item.lead_id]?.assignedUserId ?? ""}
                          onChange={(event) =>
                            setReminderDrafts((current) => ({
                              ...current,
                              [item.lead_id]: {
                                remindAt: current[item.lead_id]?.remindAt ?? "",
                                note: current[item.lead_id]?.note ?? "",
                                assignedUserId: event.target.value,
                              },
                            }))
                          }
                        >
                          <option value="">Assign reminder</option>
                          {assignees.map((assignee) => (
                            <option key={assignee.user_id} value={assignee.user_id}>
                              {assignee.full_name || assignee.email || assignee.user_id}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Controls>
                    <Textarea
                      value={reminderDrafts[item.lead_id]?.note ?? ""}
                      onChange={(event) =>
                        setReminderDrafts((current) => ({
                          ...current,
                          [item.lead_id]: {
                            remindAt: current[item.lead_id]?.remindAt ?? "",
                            note: event.target.value,
                            assignedUserId: current[item.lead_id]?.assignedUserId ?? "",
                          },
                        }))
                      }
                      placeholder="Reminder note"
                    />
                    <Controls>
                      <Button
                        type="button"
                        $primary
                        onClick={() => void handleAddReminder(item.lead_id)}
                        disabled={savingLeadId === item.lead_id}
                      >
                        Add reminder
                      </Button>
                    </Controls>
                    {item.reminders.length ? (
                      <NoteList>
                        {item.reminders.slice(0, 3).map((reminder) => (
                          <NoteItem key={reminder.id}>
                            <SmallText>
                              {formatDateTime(reminder.remind_at)} • {reminder.assigned_name || "Unassigned"}
                            </SmallText>
                            <div style={{ color: "#e7edf8", lineHeight: 1.6 }}>{reminder.note || "Reminder"}</div>
                            <Controls>
                              <Select
                                value={reminder.status || "pending"}
                                onChange={(event) =>
                                  void handleReminderStatus(item.lead_id, reminder.id, event.target.value)
                                }
                                disabled={savingLeadId === item.lead_id}
                              >
                                <option value="pending">Pending</option>
                                <option value="done">Done</option>
                                <option value="canceled">Canceled</option>
                              </Select>
                            </Controls>
                          </NoteItem>
                        ))}
                      </NoteList>
                    ) : (
                      <SmallText>No reminders yet.</SmallText>
                    )}
                  </Section>
                </Card>
              );
            })}
          </List>
        </>
      )}
    </Page>
  );
}

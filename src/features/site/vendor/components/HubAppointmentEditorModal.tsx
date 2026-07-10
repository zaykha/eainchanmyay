"use client";

import { useMemo, useState } from "react";
import { Clock, MapPin, Trash2, Users2, X } from "lucide-react";
import styled from "styled-components";
import { Panel } from "@/features/site/shared/components/PageSection";
import { CustomSelect } from "@/features/site/shared/components/form-controls/CustomSelect";
import { CustomTextarea } from "@/features/site/shared/components/form-controls/CustomTextarea";
import type { Translate } from "@/features/site/shared/lib/i18n";

type PropertyOption = {
  id: string;
  title: string | null;
};

type AssignmentOption = {
  id: string;
  name: string;
};

type SelectOption = {
  value: string;
  label: string;
};

type SelectedAppointmentMeta = {
  propertyTitle: string;
  propertyLocation: string;
  startAt: string | null;
  clientName: string;
};

type HubAppointmentEditorModalProps = {
  open: boolean;
  t: Translate;
  locale: string;
  mode: "edit" | "create";
  isReadOnlyLead: boolean;
  isPropertyLocked: boolean;
  selectedAppointmentMeta: SelectedAppointmentMeta | null;
  propertyOptions: PropertyOption[];
  statusOptions: SelectOption[];
  timeOptions: string[];
  appointmentAssignments: AssignmentOption[];
  propertyId: string;
  status: string;
  title: string;
  startAt: string;
  clientName: string;
  clientPhone: string;
  assignee: string;
  notes: string;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  onChangePropertyId: (value: string) => void;
  onChangeStatus: (value: string) => void;
  onChangeTitle: (value: string) => void;
  onChangeStartAt: (value: string) => void;
  onChangeClientName: (value: string) => void;
  onChangeClientPhone: (value: string) => void;
  onChangeAssignee: (value: string) => void;
  onChangeNotes: (value: string) => void;
};

type AppointmentDatePickerProps = {
  name: string;
  label: string;
  value: string;
  locale: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

function parseDateOnly(value: string) {
  const parts = value.split("-").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

function formatDatePickerLabel(value: string | undefined, locale: string) {
  if (!value) return "";
  const parsed = parseDateOnly(value);
  if (!parsed) return "";
  return parsed.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const start = new Date(year, month, 1);
  const startDay = start.getDay();
  const first = new Date(year, month, 1 - startDay);
  const days: Array<{ date: Date; inMonth: boolean }> = [];

  for (let i = 0; i < 42; i += 1) {
    const current = new Date(first);
    current.setDate(first.getDate() + i);
    days.push({ date: current, inMonth: current.getMonth() === month });
  }

  return days;
}

function toDateString(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDatePart(value: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

function getTimePart(value: string) {
  if (!value) return "";
  const normalized = value.includes("T") ? value.split("T")[1] : value;
  return normalized.slice(0, 5);
}

function combineDateAndTime(date: string, time: string) {
  if (!date) return "";
  return `${date}T${time || "09:00"}`;
}

function AppointmentDatePicker({ name, label, value, locale, disabled, onChange }: AppointmentDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseDateOnly(value) : null;
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate ?? new Date());
  const days = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);
  const monthLabel = currentMonth.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Field $filled={Boolean(value)} data-control="select">
        <FloatingLabel htmlFor={name}>{label}</FloatingLabel>
        <DateTrigger
          type="button"
          id={name}
          name={name}
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setCurrentMonth(selectedDate ?? new Date());
            setOpen(true);
          }}
        >
          <DateValue $muted={!value}>{formatDatePickerLabel(value, locale) || "\u00A0"}</DateValue>
        </DateTrigger>
      </Field>
      {open ? (
        <CalendarOverlay onClick={() => setOpen(false)}>
          <CalendarCard onClick={(event) => event.stopPropagation()}>
            <CalendarHeader>
              <CalendarNav
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              >
                Prev
              </CalendarNav>
              <strong>{monthLabel}</strong>
              <CalendarNav
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              >
                Next
              </CalendarNav>
            </CalendarHeader>
            <CalendarGrid>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <CalendarWeekday key={day}>{day}</CalendarWeekday>
              ))}
              {days.map((item) => {
                const key = toDateString(item.date);
                const active = value === key;
                return (
                  <CalendarDay
                    key={key}
                    type="button"
                    $muted={!item.inMonth}
                    $active={active}
                    onClick={() => {
                      if (disabled) return;
                      onChange(key);
                      setOpen(false);
                    }}
                  >
                    {item.date.getDate()}
                  </CalendarDay>
                );
              })}
            </CalendarGrid>
          </CalendarCard>
        </CalendarOverlay>
      ) : null}
    </>
  );
}

export function HubAppointmentEditorModal(props: HubAppointmentEditorModalProps) {
  const {
    open,
    t,
    locale,
    mode,
    isReadOnlyLead,
    isPropertyLocked,
    selectedAppointmentMeta,
    propertyOptions,
    statusOptions,
    timeOptions,
    appointmentAssignments,
    propertyId,
    status,
    title,
    startAt,
    clientName,
    clientPhone,
    assignee,
    notes,
    saving,
    error,
    onClose,
    onSave,
    onDelete,
    onChangePropertyId,
    onChangeStatus,
    onChangeTitle,
    onChangeStartAt,
    onChangeClientName,
    onChangeClientPhone,
    onChangeAssignee,
    onChangeNotes,
  } = props;

  if (!open) return null;

  const isEdit = mode === "edit";

  return (
    <Overlay onClick={onClose}>
      <Card onClick={(event) => event.stopPropagation()}>
        <Header>
          <div style={{ display: "grid", gap: 6 }}>
            <Title>{mode === "create" ? t("hub.createAppointment") : selectedAppointmentMeta?.propertyTitle || t("hub.appointment")}</Title>
          </div>
          <CloseButton type="button" onClick={onClose} aria-label={t("hub.closeAppointmentEditor")}>
            <X size={14} />
          </CloseButton>
        </Header>

        {isEdit && selectedAppointmentMeta ? (
          <>
            <Meta>
              <MetaRow>
                <MapPin size={16} />
                <span>{selectedAppointmentMeta.propertyLocation || t("hub.unspecified")}</span>
              </MetaRow>
              <MetaRow>
                <Clock size={16} />
                <span>
                  {selectedAppointmentMeta.startAt
                    ? new Date(selectedAppointmentMeta.startAt).toLocaleString(locale, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : t("hub.timePending")}
                </span>
              </MetaRow>
              <MetaRow>
                <Users2 size={16} />
                <span>{selectedAppointmentMeta.clientName || t("hub.buyer")}</span>
              </MetaRow>
            </Meta>
            <Divider />
          </>
        ) : null}

        <Sections>
          <Section>
            <SectionHeader>
              <SectionTitle>{t("hub.appointmentDetails")}</SectionTitle>
            </SectionHeader>
            <Grid>
              <Field>
                <CustomSelect
                  id="appointment-property"
                  name="appointment-property"
                  label={t("vendor.viewing.property")}
                  value={propertyId}
                  onChange={onChangePropertyId}
                  disabled={isEdit || isPropertyLocked}
                >
                  <option value="">{t("hub.selectProperty")}</option>
                  {propertyOptions.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.title || t("vendor.properties.untitled")}
                    </option>
                  ))}
                </CustomSelect>
              </Field>

              <Field>
                <CustomSelect
                  id="appointment-status"
                  name="appointment-status"
                  label={t("vendor.inquiries.status")}
                  value={status}
                  onChange={onChangeStatus}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </CustomSelect>
              </Field>

              <Field $filled={Boolean(title)}>
                <FloatingLabel htmlFor="appointment-title">{t("hub.title")}</FloatingLabel>
                <Input
                  id="appointment-title"
                  name="appointment-title"
                  value={title}
                  onChange={(event) => onChangeTitle(event.target.value)}
                  disabled={isReadOnlyLead}
                />
              </Field>

              <AppointmentDatePicker
                name="appointment-date"
                label={t("hub.date")}
                value={getDatePart(startAt)}
                locale={locale}
                disabled={isReadOnlyLead}
                onChange={(date) => onChangeStartAt(combineDateAndTime(date, getTimePart(startAt)))}
              />

              <Field>
                <CustomSelect
                  id="appointment-time"
                  name="appointment-time"
                  label={t("hub.time")}
                  value={getTimePart(startAt)}
                  onChange={(time) => onChangeStartAt(combineDateAndTime(getDatePart(startAt), time))}
                  disabled={isReadOnlyLead}
                >
                  {timeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </CustomSelect>
              </Field>
            </Grid>
          </Section>

          <Section>
            <SectionHeader>
              <SectionTitle>{t("hub.buyerDetails")}</SectionTitle>
            </SectionHeader>
            <Grid>
              <Field $filled={Boolean(clientName)}>
                <FloatingLabel htmlFor="appointment-client-name">{t("hub.clientName")}</FloatingLabel>
                <Input
                  id="appointment-client-name"
                  name="appointment-client-name"
                  value={clientName}
                  onChange={(event) => onChangeClientName(event.target.value)}
                  disabled={isReadOnlyLead}
                />
              </Field>
              <Field $filled={Boolean(clientPhone)}>
                <FloatingLabel htmlFor="appointment-client-phone">{t("hub.clientPhone")}</FloatingLabel>
                <Input
                  id="appointment-client-phone"
                  name="appointment-client-phone"
                  value={clientPhone}
                  onChange={(event) => onChangeClientPhone(event.target.value)}
                  disabled={isReadOnlyLead}
                />
              </Field>
            </Grid>
          </Section>

          <Section>
            <SectionHeader>
              <SectionTitle>{t("hub.assignment")}</SectionTitle>
            </SectionHeader>
            <Field>
              <CustomSelect
                id="appointment-assignee"
                name="appointment-assignee"
                label={t("hub.assignedStaff")}
                value={assignee}
                onChange={onChangeAssignee}
              >
                <option value="">{t("hub.unassigned")}</option>
                {appointmentAssignments.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </CustomSelect>
            </Field>
          </Section>

          <Section>
            <SectionHeader>
              <SectionTitle>{t("hub.notes")}</SectionTitle>
            </SectionHeader>
            <Field>
              <CustomTextarea
                id="appointment-notes"
                name="appointment-notes"
                label={t("hub.notes")}
                value={notes}
                onChange={(event) => onChangeNotes(event.target.value)}
                disabled={isReadOnlyLead}
              />
            </Field>
          </Section>
        </Sections>

        {error ? <ErrorText>{error}</ErrorText> : null}

        <Actions>
          {isEdit ? (
            <DangerButton type="button" onClick={onDelete} disabled={saving}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Trash2 size={16} />
                {t("hub.delete")}
              </span>
            </DangerButton>
          ) : (
            <div />
          )}
          <ActionGroup>
            <GhostButton type="button" onClick={onClose} disabled={saving}>
              {t("listing.cancel")}
            </GhostButton>
            <PrimaryButton type="button" onClick={onSave} disabled={saving}>
              {saving
                ? mode === "create"
                  ? t("hub.creating")
                  : t("hub.saving")
                : mode === "create"
                  ? t("hub.createAppointment")
                  : t("common.saveChanges")}
            </PrimaryButton>
          </ActionGroup>
        </Actions>
      </Card>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(12, 18, 36, 0.4);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 1000;

  @media (max-width: 720px) {
   align-items: flex-start;
  }
`;

const Card = styled(Panel)`
  max-width: 720px;
  width: min(720px, 94vw);
  display: grid;
  gap: 10px;
  height: min(760px, calc(100vh - 48px));
  overflow-y: auto;
  overscroll-behavior: contain;
  box-shadow: 0 24px 54px rgba(15, 23, 42, 0.14);

  &::after {
    display: none;
  }

  @media (max-width: 720px) {
    width: 90vw;
    max-width: 100vw;
    height: 90dvh;
    max-height: 100dvh;
    border-radius: 10px;
    gap: 8px;
    padding-top: max(12px, env(safe-area-inset-top));
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const Title = styled.strong`
  color: var(--color-text);
  font-size: 1rem;
  line-height: 1.2;

  @media (max-width: 720px) {
    font-size: 0.96rem;
  }
`;

const CloseButton = styled.button`
  min-width: 34px;
  min-height: 34px;
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 34px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
`;

const Divider = styled.div`
  border-top: 1px solid var(--color-outline);
`;

const Meta = styled.div`
  display: grid;
  gap: 10px;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-muted);
  font-size: 0.9rem;
  flex-wrap: wrap;
`;

const Sections = styled.div`
  display: grid;
  gap: 16px;
`;

const Section = styled.section`
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: color-mix(in srgb, var(--color-surface-2) 84%, white);
`;

const SectionHeader = styled.div`
  display: grid;
  gap: 4px;
`;

const SectionTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.98rem;
`;

const Grid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div.attrs<{ $filled?: boolean; $status?: "default" | "error" | "success" }>((props) => ({
  className: "Field",
  "data-filled": props.$filled ? "true" : "false",
  "data-status": props.$status ?? "default",
}))``;

const FloatingLabel = styled.label.attrs({
  className: "Label",
})``;

const Input = styled.input.attrs({
  className: "Control",
})`
  min-height: 50px;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const DateValue = styled.span<{ $muted?: boolean }>`
  color: ${(props) => (props.$muted ? "var(--color-muted)" : "var(--color-text)")};
  font-size: 0.95rem;
  line-height: 1.2;
`;

const DateTrigger = styled.button.attrs({
  className: "Control SelectTrigger SelectTrigger--plain",
})`
  min-height: 50px;
  cursor: pointer;
  display: flex;
  align-items: center;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const CalendarOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(12, 18, 36, 0.4);
  display: grid;
  place-items: center;
  z-index: 1100;
  padding: 16px;
`;

const CalendarCard = styled.div`
  width: min(420px, 100%);
  background: var(--color-surface-2);
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  box-shadow: var(--shadow-soft);
  padding: 16px;
  display: grid;
  gap: 12px;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
`;

const CalendarNav = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 10px;
  padding: 6px 10px;
  background: var(--color-surface);
  cursor: pointer;
  color: var(--color-text);
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
`;

const CalendarWeekday = styled.span`
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-muted);
  font-weight: 600;
`;

const CalendarDay = styled.button<{ $muted?: boolean; $active?: boolean }>`
  border: 1px solid var(--color-outline);
  border-radius: 10px;
  padding: 8px 0;
  background: ${(props) =>
    props.$active ? "color-mix(in srgb, var(--color-primary) 18%, transparent)" : "transparent"};
  color: ${(props) =>
    props.$active ? "var(--color-primary)" : props.$muted ? "var(--color-muted)" : "var(--color-text)"};
  cursor: pointer;
  font-weight: 600;
`;

const ErrorText = styled.p`
  margin: 0;
  color: var(--color-primary);
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const GhostButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;
`;

const PrimaryButton = styled.button`
  border: 1px solid color-mix(in srgb, var(--color-primary) 24%, var(--color-outline));
  border-radius: var(--radius-md);
  padding: 10px 14px;
  background: var(--gradient);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
`;

const DangerButton = styled.button`
  border: 1px solid color-mix(in srgb, var(--color-primary) 30%, var(--color-outline));
  border-radius: var(--radius-md);
  padding: 10px 14px;
  background: color-mix(in srgb, var(--color-primary) 8%, white);
  color: var(--color-primary);
  font-weight: 700;
  cursor: pointer;
`;

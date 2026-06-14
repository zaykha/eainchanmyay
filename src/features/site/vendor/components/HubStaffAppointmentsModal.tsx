"use client";

import { MapPin, X } from "lucide-react";
import styled from "styled-components";
import { Panel } from "@/features/site/shared/components/PageSection";

type Translate = (key: string, vars?: Record<string, unknown>) => string;

type Assignment = {
  id: string;
  name: string;
  role: string;
  assigned_count: number;
};

type StaffAppointment = {
  id: string;
  title: string;
  property_title: string;
  property_location: string;
  start_at: string | null;
  client_name: string;
  status: string;
};

type HubStaffAppointmentsModalProps = {
  open: boolean;
  t: Translate;
  locale: string;
  assignment: Assignment | null;
  appointments: StaffAppointment[];
  showPast: boolean;
  onClose: () => void;
  onTogglePast: () => void;
  onOpenAppointment: (appointmentId: string) => void;
  formatRoleLabel: (value: string | null | undefined) => string;
  formatStatusLabel: (value: string | null | undefined) => string;
};

function getStatusTone(status: string) {
  if (status === "completed" || status === "closed_won") return "success";
  if (status === "cancelled" || status === "closed_lost" || status === "no_show" || status === "spam") return "danger";
  return "warning";
}

export function HubStaffAppointmentsModal(props: HubStaffAppointmentsModalProps) {
  const {
    open,
    t,
    locale,
    assignment,
    appointments,
    showPast,
    onClose,
    onTogglePast,
    onOpenAppointment,
    formatRoleLabel,
    formatStatusLabel,
  } = props;

  if (!open || !assignment) return null;

  return (
    <Overlay onClick={onClose}>
      <Card onClick={(event) => event.stopPropagation()}>
        <Header>
          <div style={{ display: "grid", gap: 6 }}>
            <strong>{assignment.name}</strong>
            <Muted>
              {formatRoleLabel(assignment.role)} •{" "}
              {assignment.assigned_count > 1
                ? t("hub.assignedAppointmentsPlural", { count: assignment.assigned_count })
                : t("hub.assignedAppointmentsSingular", { count: assignment.assigned_count })}
            </Muted>
          </div>
          <CloseButton type="button" onClick={onClose} aria-label={t("hub.closeStaffAppointments")}>
            <X size={16} />
          </CloseButton>
        </Header>

        <Body>
          <MainPanel>
            <PanelHeader>
              <PanelTitle>{t("hub.appointmentsByStaff")}</PanelTitle>
              <ToggleButton type="button" $active={showPast} onClick={onTogglePast}>
                {showPast ? t("hub.hidePreviousTasks") : t("hub.showPreviousTasks")}
              </ToggleButton>
            </PanelHeader>
            <List>
              {appointments.length ? (
                appointments.map((appointment) => (
                  <Row key={appointment.id} type="button" onClick={() => onOpenAppointment(appointment.id)}>
                    <RowTop>
                      <div style={{ display: "grid", gap: 4 }}>
                        <RowTitle>{appointment.property_title || appointment.title || t("hub.untitledAppointment")}</RowTitle>
                        <RowMeta>
                          <span>
                            {appointment.start_at
                              ? new Date(appointment.start_at).toLocaleString(locale, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : t("hub.timePending")}
                          </span>
                          <span>•</span>
                          <span>{appointment.client_name || t("hub.buyer")}</span>
                        </RowMeta>
                      </div>
                      <Pill $tone={getStatusTone(appointment.status)}>{formatStatusLabel(appointment.status)}</Pill>
                    </RowTop>
                    <RowMeta>
                      <MapPin size={14} />
                      <span>{appointment.property_location || t("hub.unspecified")}</span>
                    </RowMeta>
                  </Row>
                ))
              ) : (
                <EmptyCopy>{showPast ? t("hub.noStaffAppointments") : t("hub.noUpcomingStaffAppointments")}</EmptyCopy>
              )}
            </List>
          </MainPanel>

          <Aside>
            <PanelTitle>{t("hub.assignmentSummary")}</PanelTitle>
            <Summary>
              <SummaryRow>
                <SummaryLabel>{t("hub.assignedNow")}</SummaryLabel>
                <SummaryValue>
                  {assignment.assigned_count > 1
                    ? t("hub.assignedAppointmentsPlural", { count: assignment.assigned_count })
                    : t("hub.assignedAppointmentsSingular", { count: assignment.assigned_count })}
                </SummaryValue>
              </SummaryRow>
              <SummaryRow>
                <SummaryLabel>{t("hub.visibleInView")}</SummaryLabel>
                <SummaryValue>{t("hub.itemsCount", { count: appointments.length })}</SummaryValue>
              </SummaryRow>
              <SummaryRow>
                <SummaryLabel>{t("hub.scope")}</SummaryLabel>
                <SummaryValue>{showPast ? t("hub.allTasks") : t("hub.upcomingOnly")}</SummaryValue>
              </SummaryRow>
            </Summary>
          </Aside>
        </Body>
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
  z-index: 1000;
  padding: 16px;
`;

const Card = styled(Panel)`
  max-width: 1120px;
  width: min(1120px, 96vw);
  max-height: 70vh;
  overflow-y: auto;
  display: grid;
  gap: 14px;
  align-content: start;
  box-shadow: 0 24px 54px rgba(15, 23, 42, 0.14);

  &::after {
    display: none;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const CloseButton = styled.button`
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  min-width: 36px;
  min-height: 36px;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 36px;
`;

const Muted = styled.span`
  color: var(--color-muted);
  font-size: 0.9rem;
  line-height: 1.45;
`;

const Body = styled.div`
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  gap: 10px;
  align-content: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const MainPanel = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: color-mix(in srgb, var(--color-surface-2) 84%, white);
  padding: 12px;
  display: grid;
  gap: 8px;
  min-height: 0;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
`;

const PanelTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.94rem;
`;

const ToggleButton = styled.button<{ $active?: boolean }>`
  border: 1px solid
    ${(props) =>
      props.$active ? "color-mix(in srgb, var(--color-primary) 28%, var(--color-outline))" : "var(--color-outline)"};
  border-radius: 999px;
  padding: 7px 11px;
  background: ${(props) => (props.$active ? "#fff1f3" : "var(--color-surface)")};
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-text)")};
  font-weight: 700;
  cursor: pointer;
`;

const List = styled.div`
  min-height: 0;
  overflow-y: auto;
  display: grid;
  gap: 5px;
  padding-right: 4px;
`;

const Row = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  background: var(--color-surface);
  padding: 8px 10px;
  display: grid;
  gap: 4px;
  text-align: left;
  cursor: pointer;
`;

const RowTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

const RowTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.84rem;
  line-height: 1.3;
`;

const RowMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  color: var(--color-muted);
  font-size: 0.74rem;
`;

const Pill = styled.span<{ $tone?: "success" | "warning" | "danger" }>`
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  border: 1px solid var(--color-outline);
  background: ${(props) =>
    props.$tone === "success" ? "#ecfdf5" : props.$tone === "danger" ? "#fff1f2" : "#fff1f3"};
  color: ${(props) =>
    props.$tone === "success" ? "#0f766e" : props.$tone === "danger" ? "#be123c" : "#b4233a"};
`;

const EmptyCopy = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.55;
`;

const Aside = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: color-mix(in srgb, var(--color-surface-2) 84%, white);
  padding: 12px;
  display: grid;
  align-content: start;
  gap: 8px;
  min-height: 0;
  overflow-y: auto;
`;

const Summary = styled.div`
  display: grid;
  gap: 8px;
`;

const SummaryRow = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  background: var(--color-surface);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const SummaryLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.8rem;
`;

const SummaryValue = styled.strong`
  color: var(--color-text);
  font-size: 0.9rem;
`;

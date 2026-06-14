"use client";

import type { RefObject } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, Users2 } from "lucide-react";
import styled from "styled-components";

type Translate = (key: string, vars?: Record<string, unknown>) => string;

type WeekDay = { day: string; date: string; count: number; active?: boolean };
type MonthDetail = { id: string; property: string; time: string; assignee: string };
type MonthCell = { key: string; muted?: boolean; active?: boolean; day: string | number; count: number; details: MonthDetail[] };
type Assignment = { id: string; name: string; role: string; assigned_count: number };
type QueueItem = {
  id: string;
  time: string;
  dayLabel: string;
  property: string;
  client: string;
  location: string;
  owner: string;
  status: string;
  source?: string | null;
  isUnread?: boolean;
};

type HubAppointmentsViewProps = {
  t: Translate;
  appointmentStats: { today: number; unassigned: number; upcoming: number };
  appointmentCalendarView: "week" | "month";
  appointmentMonthLabel: string;
  appointmentWeekDays: WeekDay[];
  appointmentMonthCells: MonthCell[];
  appointmentPopupDay: string | null;
  appointmentMonthPopupRef: RefObject<HTMLDivElement | null>;
  appointmentAssignments: Assignment[];
  appointmentDashboardLoading: boolean;
  appointmentDashboardError: string | null;
  hasAppointmentDashboard: boolean;
  appointmentQueue: QueueItem[];
  canManageTeam: boolean;
  canCreateAppointments: boolean;
  formatRoleLabel: (value: string | null | undefined) => string;
  onSetAppointmentMonthOffset: (delta: number) => void;
  onSetAppointmentPopupDay: (day: string | null | ((current: string | null) => string | null)) => void;
  onSetAppointmentCalendarView: (view: "week" | "month") => void;
  onSelectAssignment: (staffId: string) => void;
  onCreateAppointment: () => void;
  onOpenAppointmentEditor: (appointmentId: string) => void;
  onResetAssignmentHistory: () => void;
};

const Viewport = styled.div`
  width: 100%;
  min-width: 0;
`;

const Scroller = styled.div`
  display: grid;
  gap: 16px;
  min-width: 0;
`;

const Copy = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.55;
`;

const Card = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 24px;
  background: color-mix(in srgb, var(--color-surface-2) 72%, white);
  padding: 18px;
  display: grid;
  gap: 14px;
  min-width: 0;
  overflow: visible;

  @media (max-width: 640px) {
    border-radius: 22px;
    padding: 14px;
    gap: 12px;
  }
`;

const Layout = styled.div`
  display: grid;
  gap: 16px;
  min-width: 0;

  @media (max-width: 640px) {
    gap: 14px;
  }
`;

const TopGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  gap: 16px;
  min-width: 0;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 640px) {
    gap: 14px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;

  @media (max-width: 640px) {
    gap: 10px;
  }
`;

const TitleWrap = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;
`;

const Title = styled.h3`
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  line-height: 1.35;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  svg {
    flex: 0 0 auto;
  }

  @media (max-width: 640px) {
    font-size: 0.98rem;
    line-height: 1.45;
  }
`;

const HeaderCopy = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.45;
  font-size: 0.9rem;

  @media (max-width: 640px) {
    font-size: 0.84rem;
    line-height: 1.5;
  }
`;

const Pill = styled.span<{ $tone?: "neutral" | "warning" | "success" }>`
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1.25;
  white-space: nowrap;
  border: 1px solid var(--color-outline);
  background: ${(p) =>
    p.$tone === "warning"
      ? "#fff1f3"
      : p.$tone === "success"
        ? "#ecfdf5"
        : "var(--color-surface)"};
  color: ${(p) =>
    p.$tone === "warning"
      ? "#b4233a"
      : p.$tone === "success"
        ? "#0f766e"
        : "var(--color-text)"};

  svg {
    flex: 0 0 auto;
  }

  @media (max-width: 640px) {
    min-height: 26px;
    padding: 0 9px;
    font-size: 0.72rem;
  }
`;

const Stats = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-width: 0;

  @media (max-width: 640px) {
    gap: 8px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 380px) {
    grid-template-columns: 1fr;
  }
`;

const Stat = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  background: var(--color-surface);
  padding: 10px 12px;
  display: grid;
  gap: 4px;
  min-width: 0;

  @media (max-width: 640px) {
    border-radius: 14px;
    padding: 9px 8px;
  }
`;

const StatLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1.25;

  @media (max-width: 640px) {
    font-size: 0.62rem;
    letter-spacing: 0.06em;
  }
`;

const StatValue = styled.strong`
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.35;

  @media (max-width: 640px) {
    font-size: 0.78rem;
  }
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    width: 100%;
    justify-content: stretch;
    gap: 6px;
  }
`;

const ToggleButton = styled.button<{ $active?: boolean }>`
  border: 1px solid
    ${(p) =>
    p.$active
      ? "color-mix(in srgb, var(--color-primary) 28%, var(--color-outline))"
      : "var(--color-outline)"};
  border-radius: 999px;
  padding: 7px 13px;
  background: ${(p) => (p.$active ? "var(--gradient)" : "var(--color-surface)")};
  color: ${(p) => (p.$active ? "#fff" : "var(--color-text)")};
  font-weight: 700;
  cursor: pointer;
  min-height: 34px;
  line-height: 1.2;

  @media (max-width: 640px) {
    flex: 1 1 0;
    min-width: 0;
    padding: 8px 10px;
    font-size: 0.82rem;
  }
`;

const MonthNav = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;

  @media (max-width: 640px) {
    justify-content: space-between;
    width: 100%;
  }
`;

const MonthButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 10px;
  padding: 6px 10px;
  background: var(--color-surface);
  cursor: pointer;
  color: var(--color-text);
  min-height: 34px;
  display: inline-grid;
  place-items: center;
`;

const MonthLabel = styled.strong`
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.3;

  @media (max-width: 640px) {
    font-size: 0.84rem;
  }
`;

const WeekScroller = styled.div`
  overflow-x: auto;
  padding-bottom: 6px;
  min-width: 0;
  scrollbar-width: thin;

  @media (max-width: 640px) {
    margin-inline: -2px;
    padding-inline: 2px;
  }
`;

const WeekRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  min-width: 720px;

  @media (max-width: 640px) {
    min-width: 560px;
    gap: 8px;
  }
`;

const DayCell = styled.div<{ $active?: boolean }>`
  border: 1px solid
    ${(p) =>
    p.$active
      ? "color-mix(in srgb, var(--color-primary) 34%, var(--color-outline))"
      : "var(--color-outline)"};
  border-radius: 18px;
  background: ${(p) => (p.$active ? "#fff7f8" : "var(--color-surface)")};
  padding: 12px;
  display: grid;
  gap: 8px;
  min-width: 0;
  min-height: 94px;

  @media (max-width: 640px) {
    border-radius: 16px;
    padding: 10px;
    min-height: 86px;
    gap: 5px;
  }
`;

const DayName = styled.span`
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  line-height: 1.2;

  @media (max-width: 640px) {
    font-size: 0.66rem;
  }
`;

const DayDate = styled.strong`
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.25;

  @media (max-width: 640px) {
    font-size: 0.92rem;
  }
`;

const Count = styled.span<{ $active?: boolean }>`
  color: ${(p) => (p.$active ? "var(--color-primary)" : "#059669")};
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.25;

  @media (max-width: 640px) {
    font-size: 0.74rem;
  }
`;

const CalendarSplit = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 14px;
  min-width: 0;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const MonthWeekdays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
`;

const MonthWeekday = styled.div`
  padding: 0 4px;
  color: var(--color-muted);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  text-align: center;
  line-height: 1.2;

  @media (max-width: 640px) {
    font-size: 0.62rem;
    padding: 0 1px;
  }
`;

const MonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;

  @media (max-width: 640px) {
    gap: 4px;
  }
`;

const MonthCellEl = styled.div<{ $muted?: boolean; $active?: boolean }>`
  min-height: 48px;
  border: 1px solid
    ${(p) =>
    p.$active
      ? "color-mix(in srgb, var(--color-primary) 18%, var(--color-outline))"
      : "var(--color-outline)"};
  border-radius: 18px;
  background: ${(p) => (p.$active ? "#fff7f8" : "var(--color-surface)")};
  padding: 7px 8px;
  display: grid;
  align-content: start;
  justify-items: start;
  gap: 6px;
  opacity: ${(p) => (p.$muted ? 0.45 : 1)};
  cursor: ${(p) => (p.$active ? "pointer" : "default")};
  position: relative;
  min-width: 0;

  @media (max-width: 640px) {
    min-height: 42px;
    border-radius: 12px;
    padding: 6px;
    gap: 4px;
  }
`;

const Dot = styled.span<{ $active?: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: ${(p) => (p.$active ? "var(--color-primary)" : "var(--color-muted)")};
`;

const Popup = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 5;
  min-width: 220px;
  max-width: 260px;
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: #fff;
  box-shadow: var(--frame-shadow);
  padding: 12px;
  display: grid;
  gap: 8px;

  @media (max-width: 640px) {
    position: fixed;
    inset: auto 12px 24px 12px;
    max-width: none;
    min-width: 0;
    z-index: 120;
  }
`;

const PopupTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.84rem;
  line-height: 1.35;
`;

const PopupList = styled.div`
  display: grid;
  gap: 6px;
`;

const PopupItem = styled.button`
  text-align: left;
  border: 1px solid var(--color-outline);
  border-radius: 14px;
  background: var(--color-surface);
  padding: 8px 10px;
  display: grid;
  gap: 3px;
  cursor: pointer;
`;

const PopupProperty = styled.strong`
  color: var(--color-text);
  font-size: 0.8rem;
  line-height: 1.35;
`;

const PopupMeta = styled.div`
  color: var(--color-muted);
  font-size: 0.76rem;
  line-height: 1.35;
`;

const AssignmentList = styled.div`
  display: grid;
  gap: 10px;
  max-height: 206px;
  overflow-y: auto;
  padding-right: 4px;
  align-content: start;
  min-width: 0;

  @media (max-width: 640px) {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
`;

const AssignmentRow = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 14px;
  background: var(--color-surface);
  padding: 10px 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  min-width: 0;

  @media (max-width: 640px) {
    border-radius: 18px;
    padding: 12px;
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const AssignmentTop = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-wrap: wrap;
  color: var(--color-muted);
  font-size: 0.86rem;
  line-height: 1.35;

  @media (max-width: 640px) {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;

    span {
      display: none;
    }

    span:last-child {
      display: block;
      color: var(--color-muted);
    }
  }
`;

const AssignmentName = styled.strong`
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.35;

  @media (max-width: 640px) {
    font-size: 0.96rem;
  }
`;

const QueueList = styled.div`
  display: grid;
  gap: 10px;
  max-height: 372px;
  overflow-y: auto;
  padding-right: 4px;
  align-content: start;
  min-width: 0;

  @media (max-width: 640px) {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
`;

const QueueRow = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: var(--color-surface);
  padding: 14px 16px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  display: grid;
  grid-template-columns: 92px minmax(0, 1.4fr) minmax(0, 0.8fr) auto;
  gap: 14px;
  align-items: center;
  min-width: 0;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 640px) {
    grid-template-columns: 78px minmax(0, 1fr);
    grid-template-areas:
      "time main"
      "time side"
      "time status";
    align-items: stretch;
    gap: 8px 12px;
    padding: 0;
    overflow: hidden;
  }
`;

const QueueTime = styled.div`
  display: grid;
  gap: 4px;

  @media (max-width: 640px) {
    grid-area: time;
    min-height: 100%;
    align-content: center;
    justify-items: center;
    padding: 14px 8px;
    background: #fff1f3;
    border-right: 1px solid color-mix(in srgb, var(--color-primary) 16%, var(--color-outline));
  }
`;

const QueueTimeValue = styled.strong`
  color: var(--color-text);
  font-size: 0.96rem;
  line-height: 1.2;

  @media (max-width: 640px) {
    color: var(--color-primary);
    font-size: 1rem;
    text-align: center;
  }
`;

const QueueTimeLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1.25;

  @media (max-width: 640px) {
    text-align: center;
    font-size: 0.66rem;
  }
`;

const QueueMain = styled.div`
  display: grid;
  gap: 6px;
  min-width: 0;

  @media (max-width: 640px) {
    grid-area: main;
    padding: 14px 12px 0 0;
  }
`;

const QueueTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.94rem;
  line-height: 1.3;

  @media (max-width: 640px) {
    font-size: 0.98rem;
  }
`;

const QueueMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-muted);
  font-size: 0.8rem;
  flex-wrap: wrap;
  line-height: 1.35;

  @media (max-width: 640px) {
    gap: 6px;
    font-size: 0.76rem;
  }
`;

const QueueSide = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;

  @media (max-width: 640px) {
    grid-area: side;
    padding-right: 12px;
  }
`;

const QueueSideLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1.25;
`;

const QueueSideValue = styled.strong`
  color: var(--color-text);
  font-size: 0.84rem;
  line-height: 1.35;
`;

const UnreadDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--color-primary);
  display: inline-block;
  flex: 0 0 auto;
`;

const CTA = styled.button`
  min-height: 42px;
  padding: 0 14px;
  border-radius: 14px;
  border: none;
  background: var(--gradient);
  color: white;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;

  @media (max-width: 640px) {
    width: 100%;
    min-height: 46px;
  }
`;

const Skeleton = styled.div<{ $height?: number; $radius?: number }>`
  width: 100%;
  height: ${(p) => `${p.$height ?? 16}px`};
  border-radius: ${(p) => `${p.$radius ?? 14}px`};
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-surface-2) 92%, transparent) 0%,
    color-mix(in srgb, var(--color-outline) 38%, white) 50%,
    color-mix(in srgb, var(--color-surface-2) 92%, transparent) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }

    100% {
      background-position: -200% 0;
    }
  }
`;
export function HubAppointmentsView(props: HubAppointmentsViewProps) {
  const {
    t, appointmentStats, appointmentCalendarView, appointmentMonthLabel, appointmentWeekDays, appointmentMonthCells,
    appointmentPopupDay, appointmentMonthPopupRef, appointmentAssignments, appointmentDashboardLoading,
    appointmentDashboardError, hasAppointmentDashboard, appointmentQueue, canManageTeam, canCreateAppointments,
    formatRoleLabel,
    onSetAppointmentMonthOffset, onSetAppointmentPopupDay, onSetAppointmentCalendarView, onSelectAssignment,
    onCreateAppointment, onOpenAppointmentEditor, onResetAssignmentHistory,
  } = props;

  return (
    <Viewport>
      <Scroller>
        <Layout>
          <TopGrid>
            <Card>
              <Header>
                <TitleWrap>
                  <Title><Calendar size={16} style={{ marginRight: 8, verticalAlign: "text-bottom" }} />{t("hub.calendar")}</Title>
                </TitleWrap>
                <div style={{ display: "grid", gap: 10 }}>
                  {appointmentCalendarView === "month" ? (
                    <MonthNav>
                      <MonthButton type="button" aria-label={t("hub.previousMonth")} onClick={() => { onSetAppointmentPopupDay(null); onSetAppointmentMonthOffset(-1); }}><ChevronLeft size={16} /></MonthButton>
                      <MonthLabel>{appointmentMonthLabel}</MonthLabel>
                      <MonthButton type="button" aria-label={t("hub.nextMonth")} onClick={() => { onSetAppointmentPopupDay(null); onSetAppointmentMonthOffset(1); }}><ChevronRight size={16} /></MonthButton>
                    </MonthNav>
                  ) : null}
                  <ToggleRow>
                    <ToggleButton type="button" $active={appointmentCalendarView === "week"} onClick={() => { onSetAppointmentPopupDay(null); onSetAppointmentCalendarView("week"); }}>{t("hub.sevenDays")}</ToggleButton>
                    <ToggleButton type="button" $active={appointmentCalendarView === "month"} onClick={() => { onSetAppointmentPopupDay(null); onSetAppointmentCalendarView("month"); }}>{t("hub.month")}</ToggleButton>
                  </ToggleRow>
                </div>
              </Header>
              {appointmentCalendarView === "week" ? (
                <>
                  <Stats>
                    <Stat><StatLabel>{t("hub.today")}</StatLabel><StatValue>{t("hub.appointmentsTotal", { count: appointmentStats.today })}</StatValue></Stat>
                    <Stat><StatLabel>{t("hub.unassigned")}</StatLabel><StatValue>{t("hub.appointmentsTotal", { count: appointmentStats.unassigned })}</StatValue></Stat>
                    <Stat><StatLabel>{t("hub.upcoming")}</StatLabel><StatValue>{t("hub.appointmentsTotal", { count: appointmentStats.upcoming })}</StatValue></Stat>
                  </Stats>
                  <WeekScroller>
                    <WeekRow>
                      {appointmentWeekDays.map((day) => (
                        <DayCell key={`${day.day}-${day.date}`} $active={day.active}>
                          <DayName>{day.day}</DayName>
                          <DayDate>{day.date}</DayDate>
                          <Count $active={day.active}>{day.count ? t("hub.viewingsCount", { count: day.count }) : t("hub.open")}</Count>
                        </DayCell>
                      ))}
                    </WeekRow>
                  </WeekScroller>
                </>
              ) : (
                <CalendarSplit>
                  <div>
                    <MonthWeekdays>
                      {[t("hub.weekdayMon"), t("hub.weekdayTue"), t("hub.weekdayWed"), t("hub.weekdayThu"), t("hub.weekdayFri"), t("hub.weekdaySat"), t("hub.weekdaySun")].map((label) => (
                        <MonthWeekday key={label}>{label}</MonthWeekday>
                      ))}
                    </MonthWeekdays>
                    <MonthGrid>
                      {appointmentMonthCells.map((day) => (
                        <MonthCellEl key={day.key} $muted={day.muted} $active={day.active} onClick={() => { if (!day.active) return; onSetAppointmentPopupDay((current) => current === day.key ? null : day.key); }}>
                          <DayDate>{day.day}</DayDate>
                          {day.count ? <Dot $active={day.active} /> : null}
                          {appointmentPopupDay === day.key && day.details.length ? (
                            <Popup ref={appointmentMonthPopupRef} onClick={(event) => event.stopPropagation()}>
                              <PopupTitle>{appointmentMonthLabel} {day.day}</PopupTitle>
                              <PopupList>
                                {day.details.map((detail) => (
                                  <PopupItem key={`${day.key}-${detail.id}`} type="button" onClick={() => { onSetAppointmentPopupDay(null); onOpenAppointmentEditor(detail.id); }}>
                                    <PopupProperty>{detail.property}</PopupProperty>
                                    <PopupMeta>{t("hub.assignedAt", { time: detail.time, assignee: detail.assignee })}</PopupMeta>
                                  </PopupItem>
                                ))}
                              </PopupList>
                            </Popup>
                          ) : null}
                        </MonthCellEl>
                      ))}
                    </MonthGrid>
                  </div>
                  <Stats>
                    <Stat><StatLabel>{t("hub.today")}</StatLabel><StatValue>{t("hub.appointmentsTotal", { count: appointmentStats.today })}</StatValue></Stat>
                    <Stat><StatLabel>{t("hub.unassigned")}</StatLabel><StatValue>{t("hub.appointmentsTotal", { count: appointmentStats.unassigned })}</StatValue></Stat>
                    <Stat><StatLabel>{t("hub.upcoming")}</StatLabel><StatValue>{t("hub.appointmentsTotal", { count: appointmentStats.upcoming })}</StatValue></Stat>
                  </Stats>
                </CalendarSplit>
              )}
            </Card>

            <Card>
              <Header>
                <TitleWrap>
                  <Title><Users2 size={16} style={{ marginRight: 8, verticalAlign: "text-bottom" }} />{t("hub.assignment")}</Title>
                  <HeaderCopy>{t("hub.assignmentCopy")}</HeaderCopy>
                </TitleWrap>
                <Pill $tone={canManageTeam ? "success" : "neutral"}><Users2 size={14} />{canManageTeam ? t("hub.ownerControls") : t("hub.viewOnly")}</Pill>
              </Header>
              <AssignmentList>
                {appointmentAssignments.length ? appointmentAssignments.map((staff) => (
                  <AssignmentRow key={staff.id} type="button" onClick={() => { onSelectAssignment(staff.id); onResetAssignmentHistory(); }}>
                    <AssignmentTop>
                      <AssignmentName>{staff.name}</AssignmentName>
                      <span>{formatRoleLabel(staff.role)}</span>
                      <span>•</span>
                      <span>{t("hub.scheduledViewingsCount", { count: staff.assigned_count })}</span>
                    </AssignmentTop>
                    <Pill>{t("hub.assignedCount", { count: staff.assigned_count })}</Pill>
                  </AssignmentRow>
                )) : <Copy>{t("hub.noActiveTeamForAssignment")}</Copy>}
              </AssignmentList>
            </Card>
          </TopGrid>

          <Card>
            <Header>
              <TitleWrap>
                <Title><Clock size={16} style={{ marginRight: 8, verticalAlign: "text-bottom" }} />{t("hub.board")}</Title>
                <HeaderCopy>{t("hub.upcomingQueue")}</HeaderCopy>
              </TitleWrap>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Pill $tone="warning"><Clock size={14} />{t("hub.unassignedCount", { count: appointmentStats.unassigned })}</Pill>
                {canCreateAppointments ? <CTA type="button" onClick={onCreateAppointment}>{t("hub.createAppointment")}</CTA> : null}
              </div>
            </Header>
            <QueueList>
              {appointmentDashboardLoading && !hasAppointmentDashboard ? (
                <>
                  <Skeleton $height={92} $radius={18} />
                  <Skeleton $height={92} $radius={18} />
                  <Skeleton $height={92} $radius={18} />
                </>
              ) : appointmentDashboardError ? (
                <Copy>{appointmentDashboardError}</Copy>
              ) : appointmentQueue.length ? (
                appointmentQueue.map((appointment) => (
                  <QueueRow key={appointment.id} type="button" onClick={() => onOpenAppointmentEditor(appointment.id)}>
                    <QueueTime>
                      <QueueTimeValue>{appointment.time}</QueueTimeValue>
                      <QueueTimeLabel>{appointment.dayLabel}</QueueTimeLabel>
                    </QueueTime>
                    <QueueMain>
                      <QueueTitle>{appointment.property}</QueueTitle>
                      <QueueMeta>
                        {appointment.source === "viewing_request" && appointment.isUnread ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <UnreadDot />
                            {t("hub.newRequest")}
                          </span>
                        ) : null}
                        <span>{appointment.client}</span>
                        <span>•</span>
                        <span>{appointment.location}</span>
                      </QueueMeta>
                    </QueueMain>
                    <QueueSide>
                      <QueueSideLabel>{t("hub.assignee")}</QueueSideLabel>
                      <QueueSideValue>{appointment.owner}</QueueSideValue>
                    </QueueSide>
                    <Pill $tone={appointment.status === "Confirmed" ? "success" : "warning"}>{appointment.status}</Pill>
                  </QueueRow>
                ))
              ) : (
                <Copy>{t("hub.noUpcomingAppointments")}</Copy>
              )}
            </QueueList>
          </Card>
        </Layout>
      </Scroller>
    </Viewport>
  );
}

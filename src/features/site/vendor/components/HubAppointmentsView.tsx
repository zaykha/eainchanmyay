"use client";

import { useState, type RefObject } from "react";
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
  align-content: start;

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

const TitleWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
  width: 100%;
  justify-content: space-between;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;

  @media (max-width: 640px) {
    gap: 10px;
    align-items: center;

    ${TitleWrap} {
      flex: 1 1 auto;
    }
  }
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

const HeaderActions = styled.div`
  display: grid;
  gap: 10px;
  width: 100%;
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
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
  width: fit-content;
  max-width: 100%;

  @media (max-width: 640px) {
    gap: 6px;
    width: 100%;
  }
`;

const Stat = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 999px;
  background: var(--color-surface);
  padding: 0 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 0;
  min-height: 30px;
  height: auto;
  text-align: left;
  white-space: nowrap;

  @media (max-width: 640px) {
    min-height: 26px;
    padding: 0 9px;
    gap: 4px;
  }
`;

const StatLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: none;
  line-height: 1;

  &::after {
    content: ":";
  }

  @media (max-width: 640px) {
    font-size: 0.66rem;
    letter-spacing: 0.02em;
  }
`;

const StatValue = styled.strong`
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 900;
  line-height: 1;

  @media (max-width: 640px) {
    font-size: 0.72rem;
  }
`;

const ToggleRow = styled.div<{ $view?: "week" | "month" }>`
  position: relative;
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 176px;
  height: 34px;
  padding: 3px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid var(--color-outline);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.04);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: calc((100% - 6px) / 2);
    height: calc(100% - 6px);
    border-radius: 999px;
    background: var(--color-primary);
    box-shadow: 0 6px 14px rgba(225, 29, 72, 0.16);
    transform: translateX(${(p) => (p.$view === "month" ? "100%" : "0")});
    transition: transform 180ms ease;
    z-index: 0;
  }

  @media (max-width: 640px) {
    width: 148px;
    height: 30px;
    padding: 3px;

    &::before {
      top: 3px;
      left: 3px;
      width: calc((100% - 6px) / 2);
      height: calc(100% - 6px);
    }
  }
`;

const ToggleButton = styled.button<{ $active?: boolean }>`
  position: relative;
  z-index: 1;
  height: 100%;
  padding: 0 8px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: ${(p) => (p.$active ? "#fff" : "var(--color-text)")};
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  line-height: 1;
  transition: color 180ms ease;

  &:hover {
    color: ${(p) => (p.$active ? "#fff" : "var(--color-primary)")};
  }

  @media (max-width: 640px) {
    font-size: 0.68rem;
    padding: 0 6px;
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

const MobileAssignmentButton = styled.button`
  display: none;

  @media (max-width: 640px) {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid var(--color-outline);
    background: var(--color-surface);
    color: var(--color-text);
    display: inline-grid;
    place-items: center;
    cursor: pointer;
    flex: 0 0 34px;
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
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  padding: 8px 14px 10px 0;
  scrollbar-width: thin;

  @media (max-width: 640px) {
    padding: 8px 18px 10px 0;
    -webkit-overflow-scrolling: touch;
  }
`;

const DayCell = styled.div<{ $active?: boolean }>`
  position: relative;
  overflow: visible;
  border: 1px solid
    ${(p) =>
      p.$active
        ? "color-mix(in srgb, var(--color-primary) 34%, var(--color-outline))"
        : "var(--color-outline)"};
  border-radius: 14px;
  background: ${(p) => (p.$active ? "#fff7f8" : "var(--color-surface)")};
  padding: 8px;
  display: grid;
  place-items: center;
  gap: 5px;
  width: 82px;
  height: 82px;
  min-width: 82px;
  min-height: 82px;

  @media (max-width: 640px) {
    width: 50px;
    height: 58px;
    min-width: 50px;
    min-height: 58px;
    padding: 6px;
    border-radius: 14px;
    justify-self: center;
  }
`;

const DayName = styled.span`
  color: var(--color-muted);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  line-height: 1.1;
  text-align: center;

  @media (max-width: 640px) {
    font-size: 0.56rem;
  }
`;

const DayDate = styled.strong`
  color: var(--color-text);
  font-size: 0.95rem;
  line-height: 1.1;
  text-align: center;

  @media (max-width: 640px) {
    font-size: 0.9rem;
  }
`;

const Count = styled.span<{ $active?: boolean; $hasCount?: boolean }>`
  display: ${(p) => (p.$hasCount ? "inline-flex" : "none")};
  align-items: center;
  justify-content: center;
  position: absolute;
  top: -7px;
  right: -7px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1;
  box-shadow: 0 0 0 2px var(--color-surface);
  z-index: 2;
  pointer-events: none;

  @media (max-width: 640px) {
    top: -6px;
    right: -6px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    font-size: 0.62rem;
  }
`;

const MonthCount = styled.span<{ $active?: boolean }>`
  position: absolute;
  top: -7px;
  right: -7px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 800;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 2px var(--color-surface);

  @media (max-width: 640px) {
    top: -6px;
    right: -6px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    font-size: 0.62rem;
  }
`;

const CalendarSplit = styled.div`
  display: grid;
  gap: 10px;
  width: fit-content;
  max-width: 100%;
  min-width: 0;
  margin: auto;
  @media (max-width: 640px) {
    width: 100%;
    gap: 8px;
  }
`;

const MonthWeekdays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 42px);
  gap: 6px;
  width: fit-content;
  max-width: 100%;

  @media (max-width: 640px) {
    grid-template-columns: repeat(7, minmax(0, 1fr));
    width: 100%;
    gap: 4px;
  }
`;

const MonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 42px);
  gap: 6px;
  width: fit-content;
  max-width: 100%;

  @media (max-width: 640px) {
    grid-template-columns: repeat(7, minmax(0, 1fr));
    width: 100%;
    gap: 4px;
  }
`;

const WeekRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 82px);
  gap: 10px;
  width: fit-content;
  overflow: visible;

  @media (max-width: 640px) {
    grid-template-columns: repeat(7, 50px);
    min-width: max-content;
    gap: 6px;
  }
`;

const MonthWeekday = styled.div`
  padding: 0 2px;
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

const MonthCellEl = styled.div<{ $muted?: boolean; $active?: boolean; $today?: boolean }>`
  position: relative;
  overflow: visible;
  width: 42px;
  height: 42px;
  min-width: 42px;
  min-height: 42px;
  border: 1px solid
    ${(p) =>
      p.$today
        ? "color-mix(in srgb, var(--color-primary) 42%, var(--color-outline))"
        : p.$active
          ? "color-mix(in srgb, var(--color-primary) 18%, var(--color-outline))"
          : "var(--color-outline)"};
  border-radius: 14px;
  background: ${(p) =>
    p.$today
      ? "#fff1f4"
      : p.$active
        ? "#fff7f8"
        : "var(--color-surface)"};
  padding: 8px;
  display: grid;
  align-content: start;
  justify-items: start;
  gap: 6px;
  opacity: ${(p) => (p.$muted ? 0.45 : 1)};
  cursor: ${(p) => (p.$active ? "pointer" : "default")};
  box-shadow: ${(p) => (p.$today ? "inset 0 0 0 1px rgba(233, 61, 93, 0.08)" : "none")};

  @media (max-width: 640px) {
    width: auto;
    height: 42px;
    min-width: 0;
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
  scrollbar-width: thin;

  @media (max-width: 640px) {
    max-height: 198px;
    overflow-y: auto;
    padding-right: 4px;
  }
`;

const AssignmentCard = styled(Card)`
  @media (max-width: 640px) {
    display: none;
  }
`;

const MobileAssignmentOverlay = styled.button<{ $open?: boolean }>`
  display: none;

  @media (max-width: 640px) {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 120;
    border: none;
    background: rgba(15, 23, 42, 0.42);
    opacity: ${(props) => (props.$open ? 1 : 0)};
    pointer-events: ${(props) => (props.$open ? "auto" : "none")};
    transition: opacity 180ms ease;
  }
`;

const MobileAssignmentPopup = styled.div<{ $open?: boolean }>`
  display: none;

  @media (max-width: 640px) {
    display: grid;
    gap: 12px;
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    z-index: 130;
    padding: 14px;
    border-radius: 22px;
    border: 1px solid var(--color-outline);
    background: #fff;
    box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
    transform: translateY(${(props) => (props.$open ? "0" : "24px")});
    opacity: ${(props) => (props.$open ? 1 : 0)};
    pointer-events: ${(props) => (props.$open ? "auto" : "none")};
    transition:
      transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
      opacity 180ms ease;
    max-height: 80dvh;
    overflow-y: auto;
    align-content: start;
    align-items: flex-start;
  }
`;

const MobileAssignmentHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
`;

const MobileAssignmentClose = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  display: grid;
  place-items: center;
  cursor: pointer;
  flex: 0 0 34px;
`;

const AssignmentRow = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 14px;
  background: var(--color-surface);
  padding: 10px 12px;
  display: grid;
  gap: 6px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  min-width: 0;

  @media (max-width: 640px) {
    border-radius: 14px;
    padding: 10px;
    gap: 5px;
  }
`;

const AssignmentTop = styled.div`
  display: grid;
  gap: 5px;
  min-width: 0;
`;
const AssignmentMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  color: var(--color-muted);
  font-size: 0.8rem;
  line-height: 1.3;

  span {
    min-width: 0;
  }

  span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span:last-child {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  @media (max-width: 640px) {
    font-size: 0.72rem;
    gap: 8px;
  }
`;

const AssignmentName = styled.strong`
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.3;

  @media (max-width: 640px) {
    font-size: 0.86rem;
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
  scrollbar-width: thin;

  @media (max-width: 640px) {
    max-height: 430px;
    overflow-y: auto;
    padding-right: 4px;
    gap: 8px;
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
    grid-template-columns: 64px minmax(0, 1fr) auto;
    grid-template-areas:
      "time main status"
      "time side status";
    align-items: center;
    gap: 4px 10px;
    padding: 0;
    overflow: hidden;

    ${Pill} {
      grid-area: status;
      align-self: center;
      margin-right: 8px;
      min-height: 24px;
      padding: 0 8px;
      font-size: 0.68rem;
    }
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
    padding: 10px 6px;
    background: #fff1f3;
    border-right: 1px solid color-mix(in srgb, var(--color-primary) 16%, var(--color-outline));
  }
`;

const QueueMain = styled.div`
  display: grid;
  gap: 6px;
  min-width: 0;

  @media (max-width: 640px) {
    grid-area: main;
    padding: 10px 0 0 0;
    gap: 3px;
  }
`;

const QueueSide = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;

  @media (max-width: 640px) {
    grid-area: side;
    padding: 0 0 10px 0;
    gap: 2px;
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

const QueueTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.94rem;
  line-height: 1.3;

  @media (max-width: 640px) {
    font-size: 0.86rem;
    line-height: 1.25;
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
    gap: 5px;
    font-size: 0.68rem;
    line-height: 1.25;
  }
`;

const QueueSideLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1.25;

  @media (max-width: 640px) {
    font-size: 0.58rem;
  }
`;

const QueueSideValue = styled.strong`
  color: var(--color-text);
  font-size: 0.84rem;
  line-height: 1.35;

  @media (max-width: 640px) {
    font-size: 0.72rem;
    line-height: 1.25;
  }
`;

const UnreadDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--color-primary);
  display: inline-block;
  flex: 0 0 auto;
`;

const BoardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    margin-left: auto;
    gap: 6px;

    ${Pill} {
      display: none;
    }
  }
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

  .mobile-label {
    display: none;
  }

  @media (max-width: 640px) {
    width: auto;
    min-height: 34px;
    padding: 0 11px;
    border-radius: 999px;
    font-size: 0.78rem;

    .desktop-label {
      display: none;
    }

    .mobile-label {
      display: inline;
    }
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
  const [mobileAssignmentsOpen, setMobileAssignmentsOpen] = useState(false);

  const todayKey = new Date().toLocaleDateString("en-CA");
  const assignmentContent = (
    <AssignmentList>
      {appointmentAssignments.length ? appointmentAssignments.map((staff) => (
        <AssignmentRow
          key={staff.id}
          type="button"
          onClick={() => {
            onSelectAssignment(staff.id);
            onResetAssignmentHistory();
            setMobileAssignmentsOpen(false);
          }}
        >
          <AssignmentTop>
            <AssignmentName>{staff.name}</AssignmentName>

            <AssignmentMeta>
              <span>{formatRoleLabel(staff.role)}</span>
              <span>{t("hub.scheduledViewingsCount", { count: staff.assigned_count })}</span>
            </AssignmentMeta>
          </AssignmentTop>
        </AssignmentRow>
      )) : <Copy>{t("hub.noActiveTeamForAssignment")}</Copy>}
    </AssignmentList>
  );
  return (
    <Viewport>
      <Scroller>
        <Layout>
          <TopGrid>
            <Card>
              <Header>
                <TitleWrap>
                  <Title><Calendar size={16} style={{ marginRight: 8, verticalAlign: "text-bottom" }} />{t("hub.calendar")}</Title>
                  <ToggleRow $view={appointmentCalendarView}>
                    <ToggleButton
                      type="button"
                      $active={appointmentCalendarView === "week"}
                      onClick={() => {
                        onSetAppointmentPopupDay(null);
                        onSetAppointmentCalendarView("week");
                      }}
                    >
                      {t("hub.sevenDays")}
                    </ToggleButton>

                    <ToggleButton
                      type="button"
                      $active={appointmentCalendarView === "month"}
                      onClick={() => {
                        onSetAppointmentPopupDay(null);
                        onSetAppointmentCalendarView("month");
                      }}
                    >
                      {t("hub.month")}
                    </ToggleButton>
                  </ToggleRow>
                </TitleWrap>
                <Stats>
                    <Stat>
                      <StatLabel>{t("hub.today")}</StatLabel>
                      <StatValue>{appointmentStats.today}</StatValue>
                    </Stat>
                    <Stat>
                      <StatLabel>{t("hub.unassigned")}</StatLabel>
                      <StatValue>{appointmentStats.unassigned}</StatValue>
                    </Stat>
                    <Stat>
                      <StatLabel>{t("hub.upcoming")}</StatLabel>
                    <StatValue>{appointmentStats.upcoming}</StatValue>
                    </Stat>
                  </Stats>
                <HeaderActions>
                  {appointmentCalendarView === "month" ? (
                    <MonthNav>
                      <MonthButton type="button" aria-label={t("hub.previousMonth")} onClick={() => { onSetAppointmentPopupDay(null); onSetAppointmentMonthOffset(-1); }}><ChevronLeft size={16} /></MonthButton>
                      <MonthLabel>{appointmentMonthLabel}</MonthLabel>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <MonthButton type="button" aria-label={t("hub.nextMonth")} onClick={() => { onSetAppointmentPopupDay(null); onSetAppointmentMonthOffset(1); }}><ChevronRight size={16} /></MonthButton>
                        <MobileAssignmentButton type="button" aria-label={t("hub.assignment")} onClick={() => setMobileAssignmentsOpen(true)}>
                          <Users2 size={16} />
                        </MobileAssignmentButton>
                      </div>
                    </MonthNav>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <MobileAssignmentButton type="button" aria-label={t("hub.assignment")} onClick={() => setMobileAssignmentsOpen(true)}>
                        <Users2 size={16} />
                      </MobileAssignmentButton>
                    </div>
                  )}
                </HeaderActions>
              </Header>
              {appointmentCalendarView === "week" ? (
                <>
                  <WeekScroller>
                    <WeekRow>
                      {appointmentWeekDays.map((day) => (
                        <DayCell key={`${day.day}-${day.date}`} $active={day.active}>
                          <DayName>{day.day}</DayName>
                          <DayDate>{day.date}</DayDate>
                          <Count $active={day.active} $hasCount={day.count > 0}>
                            {day.count}
                          </Count>                    
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
                          <MonthCellEl
                            key={day.key}
                            $muted={day.muted}
                            $active={day.active}
                            $today={day.key === todayKey}
                            onClick={() => {
                              if (!day.active) return;
                              onSetAppointmentPopupDay((current) => (current === day.key ? null : day.key));
                            }}
                          >                          <DayDate>{day.day}</DayDate>
                          {day.count ? <MonthCount $active={day.active}>{day.count}</MonthCount> : null}
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

                </CalendarSplit>
              )}
            </Card>

            <AssignmentCard>
              <Header>
                <TitleWrap>
                  <Title><Users2 size={16} style={{ marginRight: 8, verticalAlign: "text-bottom" }} />{t("hub.assignment")}</Title>
                  {/* <HeaderCopy>{t("hub.assignmentCopy")}</HeaderCopy> */}
                  <Pill $tone={canManageTeam ? "success" : "neutral"}><Users2 size={14} />{canManageTeam ? t("hub.ownerControls") : t("hub.viewOnly")}</Pill>

                </TitleWrap>
              </Header>
              {assignmentContent}
            </AssignmentCard>
          </TopGrid>

          <Card>
            <Header>
              <TitleWrap>
                <Title><Clock size={16} style={{ marginRight: 8, verticalAlign: "text-bottom" }} />{t("hub.board")}</Title>
                {/* <HeaderCopy>{t("hub.upcomingQueue")}</HeaderCopy> */}
                <BoardActions>
                <Pill $tone="warning">
                  <Clock size={14} />
                  {t("hub.unassignedCount", { count: appointmentStats.unassigned })}
                </Pill>

                {canCreateAppointments ? (
                  <CTA type="button" onClick={onCreateAppointment}>
                    <span className="desktop-label">{t("hub.createAppointment")}</span>
                    <span className="mobile-label">+ Appointment</span>
                  </CTA>
                ) : null}
              </BoardActions>
              </TitleWrap>
              
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
        <MobileAssignmentOverlay type="button" $open={mobileAssignmentsOpen} aria-label={t("hub.assignment")} onClick={() => setMobileAssignmentsOpen(false)} />
        <MobileAssignmentPopup $open={mobileAssignmentsOpen}>
          <MobileAssignmentHeader>
            <div style={{ display: "grid", gap: 4 }}>
              <Title><Users2 size={16} />{t("hub.assignment")}</Title>
              <HeaderCopy>{t("hub.assignmentCopy")}</HeaderCopy>
            </div>
            <MobileAssignmentClose type="button" aria-label={t("vendorShell.closeMenu")} onClick={() => setMobileAssignmentsOpen(false)}>
              ×
            </MobileAssignmentClose>
          </MobileAssignmentHeader>
          <Pill $tone={canManageTeam ? "success" : "neutral"}><Users2 size={14} />{canManageTeam ? t("hub.ownerControls") : t("hub.viewOnly")}</Pill>
          {assignmentContent}
        </MobileAssignmentPopup>
      </Scroller>
    </Viewport>
  );
}

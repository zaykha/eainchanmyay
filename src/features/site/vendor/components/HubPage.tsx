"use client";

import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import styled from "styled-components";

type HubPageProps = {
  closeMenuLabel: string;
  openMenuLabel: string;
  mobileMeta: {
    icon: ReactNode;
    image?: string | null;
    label: string;
    title: string;
  };
  hubRailExpanded: boolean;
  hubRailMobileOpen: boolean;
  setHubRailExpanded: (value: boolean) => void;
  setHubRailMobileOpen: (value: boolean) => void;
  navigation: ReactNode;
  children: ReactNode;
};

const VendorGrid = styled.div`
  display: grid;
  align-items: stretch;
  gap: 16px;
  grid-template-columns: 84px minmax(0, 1fr);

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const VendorColumn = styled.div`
  display: grid;
  gap: 16px;
  align-content: start;
  align-self: stretch;
  grid-template-rows: auto minmax(0, 1fr);
`;

const VendorActionRail = styled.div<{ $expanded?: boolean; $mobileOpen?: boolean }>`
  position: relative;
  align-self: stretch;
  overflow: visible;
  min-width: 84px;
  width: 84px;

  @media (max-width: 960px) {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(84vw, 320px);
    min-width: 0;
    z-index: 130;
    background: transparent;
    transform: translateX(${(props) => (props.$mobileOpen ? "0" : "-100%")});
    opacity: ${(props) => (props.$mobileOpen ? 1 : 0)};
    visibility: ${(props) => (props.$mobileOpen ? "visible" : "hidden")};
    pointer-events: ${(props) => (props.$mobileOpen ? "auto" : "none")};
    transition:
      transform 240ms cubic-bezier(0.22, 1, 0.36, 1),
      opacity 180ms ease,
      visibility 0s linear ${(props) => (props.$mobileOpen ? "0s" : "240ms")};
  }
`;

const HubRailSurface = styled.div<{ $expanded?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 5;
  width: ${(props) => (props.$expanded ? "248px" : "84px")};
  min-height: 100%;
  padding: 12px;
  border-radius: 28px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: ${(props) => (props.$expanded ? "0 18px 44px rgba(15, 23, 42, 0.12)" : "var(--frame-shadow)")};
  overflow: visible;
  transition:
    width 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
  will-change: width;

  @media (max-width: 960px) {
    position: relative;
    width: 100%;
    min-height: 100dvh;
    height: 100dvh;
    padding: 16px 12px 18px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-left: none;
    border-radius: 0 24px 24px 0;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 24px 54px rgba(15, 23, 42, 0.16);
    overflow-y: auto;
  }
`;

const HubRailSpacer = styled.div`
  width: 84px;
  min-height: 100%;

  @media (max-width: 960px) {
    display: none;
  }
`;

const HubRailMobileBar = styled.button`
  display: none;

  @media (max-width: 960px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 12px 14px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 18px;
    background: var(--color-surface);
    box-shadow: var(--frame-shadow);
    cursor: pointer;
    text-align: left;

    html[lang="mm"] & {
      align-items: flex-start;
      min-height: 60px;
      padding-block: 13px;
    }
  }
`;

const HubRailMobileLead = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HubRailMobileWorkspace = styled.div`
  min-width: 0;
  display: grid;
  gap: 2px;

  html[lang="mm"] & {
    gap: 4px;
    overflow: visible;
  }
`;

const HubRailMobileLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  html[lang="mm"] & {
    font-size: 0.68rem;
    line-height: 1.65;
    padding-block: 2px;
    letter-spacing: 0;
    text-transform: none;
  }
`;

const HubRailMobileTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.96rem;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  html[lang="mm"] & {
    font-family: "Noto Sans Myanmar", "Padauk", "Myanmar Text", sans-serif;
    font-size: 0.92rem;
    line-height: 1.7;
    padding-block: 2px 3px;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    overflow-wrap: anywhere;
  }
`;

const HubRailMobileArrow = styled.div`
  color: var(--color-text);
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
`;

const HubRailOverlay = styled.button<{ $open?: boolean }>`
  display: none;

  @media (max-width: 960px) {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 120;
    border: none;
    background: rgba(4, 7, 12, 0.52);
    opacity: ${(props) => (props.$open ? 1 : 0)};
    pointer-events: ${(props) => (props.$open ? "auto" : "none")};
    transition: opacity 180ms ease;
  }
`;

const HubRailMobileIcon = styled.div<{ $image?: string }>`
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(235, 35, 64, 0.18);
  background: ${(props) =>
    props.$image
      ? `center / cover no-repeat url(${props.$image})`
      : "linear-gradient(135deg, rgba(235, 35, 64, 0.12), rgba(244, 114, 182, 0.16))"};
  color: var(--color-primary);
  display: grid;
  place-items: center;
  overflow: hidden;
  flex: 0 0 auto;
`;

export function HubPage({
  closeMenuLabel,
  openMenuLabel,
  mobileMeta,
  hubRailExpanded,
  hubRailMobileOpen,
  setHubRailExpanded,
  setHubRailMobileOpen,
  navigation,
  children,
}: HubPageProps) {
  return (
    <>
      <HubRailOverlay
        type="button"
        aria-label={closeMenuLabel}
        $open={hubRailMobileOpen}
        onClick={() => setHubRailMobileOpen(false)}
      />
      <HubRailMobileBar
        type="button"
        aria-label={openMenuLabel}
        onClick={() => setHubRailMobileOpen(true)}
      >
        <HubRailMobileLead>
          <HubRailMobileIcon $image={mobileMeta.image ?? undefined}>
            {!mobileMeta.image ? mobileMeta.icon : null}
          </HubRailMobileIcon>
          <HubRailMobileWorkspace>
            <HubRailMobileLabel>{mobileMeta.label}</HubRailMobileLabel>
            <HubRailMobileTitle>{mobileMeta.title}</HubRailMobileTitle>
          </HubRailMobileWorkspace>
        </HubRailMobileLead>
        <HubRailMobileArrow>
          <ArrowUpRight size={20} />
        </HubRailMobileArrow>
      </HubRailMobileBar>
      <VendorGrid>
        <VendorActionRail
          data-hub-rail="true"
          $expanded={hubRailExpanded}
          $mobileOpen={hubRailMobileOpen}
          onMouseEnter={() => setHubRailExpanded(true)}
          onMouseLeave={() => setHubRailExpanded(false)}
          onFocus={() => setHubRailExpanded(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setHubRailExpanded(false);
            }
          }}
        >
          <HubRailSurface $expanded={hubRailExpanded}>{navigation}</HubRailSurface>
          <HubRailSpacer />
        </VendorActionRail>
        <VendorColumn>{children}</VendorColumn>
      </VendorGrid>
    </>
  );
}

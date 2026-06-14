"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { Compass, ClipboardList, Settings } from "lucide-react";
import { useI18n } from "@/features/site/shared/lib/i18n";

const Shell = styled.nav`
  position: fixed;
  bottom: 12px;
  left: 0;
  right: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  max-width: 640px;
  margin: 0 auto;
  background: color-mix(in srgb, var(--color-surface) 95%, transparent);
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  padding: 4px;
  backdrop-filter: blur(8px);

  @media (max-width: 640px) {
    bottom: 8px;
    padding: 2px;
    border-radius: 14px;
  }
`;

const NavButton = styled(Link)`
  border: none;
  background: transparent;
  width: 100%;
  cursor: pointer;
  padding: 12px 10px;
  text-align: center;
  color: var(--color-muted);
  font-weight: 600;
  display: grid;
  gap: 4px;
  justify-items: center;

  @media (max-width: 640px) {
    padding: 8px 6px;
    font-size: 0.75rem;
    gap: 2px;
  }

  &[data-active="true"] {
    color: var(--color-primary);
    text-shadow: 0 0 8px color-mix(in srgb, var(--color-primary) 30%, transparent);
  }

  .nav-icon {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &:hover {
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-surface) 80%, transparent);
  }
`;

const NavIcon = styled.span`
  width: 28px;
  height: 28px;
  // border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  // border: 1px solid var(--color-outline);
  background: var(--color-surface);
  // box-shadow: var(--frame-shadow);

  svg {
    width: 25px;
    height: 25px;
    stroke: currentColor;
  }

  @media (max-width: 640px) {
    width: 22px;
    height: 22px;

    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const navItems = [
    { label: t("nav.explore"), icon: <Compass size={18} />, path: "/" },
    { label: t("nav.activities"), icon: <ClipboardList size={18} />, path: "/activities" },
    { label: t("nav.settings"), icon: <Settings size={18} />, path: "/settings" },
  ];

  return (
    <Shell>
      {navItems.map((item) => {
        const isActivitiesAlias = item.path === "/activities" && pathname === "/account";
        const isActive = pathname === item.path || isActivitiesAlias;
        return (
          <NavButton key={item.path} href={item.path} data-active={isActive}>
            <span className="nav-icon">
              <NavIcon>{item.icon}</NavIcon>
            </span>
            <span>{item.label}</span>
          </NavButton>
        );
      })}
    </Shell>
  );
}

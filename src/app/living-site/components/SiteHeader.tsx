"use client";

import Link from "next/link";
import styled from "styled-components";
import { MoonStar, Settings, SunMedium, ClipboardList } from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";
import { useThemeMode } from "@/app/living-site/components/Providers";

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 10px 16px;
  background: transparent;
`;

const HeaderInner = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 0;
  border: 1px solid var(--color-outline);
  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-soft);
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: var(--frame-shadow);
    pointer-events: none;
  }

  @media (max-width: 640px) {
    padding: 8px 10px;
    box-shadow: none;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.02em;

  @media (max-width: 640px) {
    font-size: 0.95rem;
    gap: 8px;
  }
`;

const BrandText = styled.div`
  display: grid;
`;

const BrandSub = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-muted);

  @media (max-width: 640px) {
    display: none;
  }
`;

const BrandMark = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text);
  display: grid;
  place-items: center;
  font-weight: 700;
  letter-spacing: 0.5px;
  box-shadow: var(--shadow-soft);

  @media (max-width: 640px) {
    width: 32px;
    height: 32px;
  }
`;


const Actions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const IconButton = styled(Link)`
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-outline);
  background: color-mix(in srgb, var(--color-surface) 90%, transparent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-muted);

  svg {
    width: 30px;
    height: 30px;
    stroke: currentColor;
  }

  @media (max-width: 640px) {
    width: 30px;
    height: 30px;

    svg {
      width: 22px;
      height: 22px;
    }
  }

  &:hover {
    color: var(--color-text);
    box-shadow: 0 0 0 2px rgba(12, 18, 36, 0.06);
  }
`;

export function SiteHeader() {
  const { user } = useAppState();
  const { mode, toggle } = useThemeMode();

  return (
    <Header>
      <HeaderInner>
        <Brand>
          <BrandMark>
            <img src="/KTLogo.png" alt="Eain Chan Myae logo" />
          </BrandMark>
          <BrandText>
            <Link href="/">Eain Chan Myae</Link>
            <BrandSub>Myanmar real estate marketplace</BrandSub>
          </BrandText>
        </Brand>
        <Actions>
          <IconButton href="/activities" aria-label="Activities">
            <ClipboardList strokeWidth={1.6} />
          </IconButton>
          <IconButton as="button" type="button" onClick={toggle} aria-label="Toggle theme">
            {mode === "dark" ? <SunMedium strokeWidth={1.6} /> : <MoonStar strokeWidth={1.6} />}
          </IconButton>
          <IconButton href={user ? "/settings" : "/auth"} aria-label="Settings">
            <Settings strokeWidth={1.6} />
          </IconButton>
        </Actions>
      </HeaderInner>
    </Header>
  );
}

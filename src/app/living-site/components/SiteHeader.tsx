"use client";

import Link from "next/link";
import styled from "styled-components";
import { PhoneCall, User } from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";

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
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.02em;
`;

const BrandText = styled.div`
  display: grid;
`;

const BrandSub = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-muted);
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

  &:hover {
    color: var(--color-text);
    box-shadow: 0 0 0 2px rgba(12, 18, 36, 0.06);
  }
`;

export function SiteHeader() {
  const { user } = useAppState();

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
          <IconButton href="/#contact" aria-label="Contact">
            <PhoneCall strokeWidth={1.6} />
          </IconButton>
          <IconButton href={user ? "/settings" : "/auth"} aria-label="Account">
            <User strokeWidth={1.6} />
          </IconButton>
        </Actions>
      </HeaderInner>
    </Header>
  );
}

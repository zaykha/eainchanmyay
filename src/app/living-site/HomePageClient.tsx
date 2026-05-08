"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Map, MapPin, Menu, MessageCircleMore, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import styled from "styled-components";
import { ListingGrid } from "@/app/living-site/components/ListingGrid";
import { CustomSelect } from "@/app/living-site/components/form-controls/CustomSelect";
import { useLanguage } from "@/app/living-site/components/Providers";
import { useInfiniteListings } from "@/app/living-site/hooks/useInfiniteListings";
import { useAppState } from "@/app/living-site/lib/app-state";
import { resolveHeaderAccountPresentation } from "@/app/living-site/lib/header-account";
import { isBedBathPropertyType } from "@/lib/property-types";
import { getDistricts, getStates, getTownships } from "@/app/living-site/lib/myanmar-geo";

const PageFrame = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Page = styled.div`
  flex: 1;
  padding: 14px 20px 0;

  @media (max-width: 720px) {
    padding: 0;
    font-size: 0.92rem;
  }
`;

const Shell = styled.div`
  max-width: 1280px;
  margin: 0 auto;
`;

const Header = styled.header`
  padding-bottom: 14px;

  @media (max-width: 720px) {
    padding: 0;
  }
`;

const HeaderInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(15, 23, 42, 0.12);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);

  @media (max-width: 960px) {
    flex-wrap: wrap;
    gap: 14px;
  }

  @media (max-width: 720px) {
    display: grid;
    grid-template-columns: 40px 1fr 40px;
    align-items: center;
    border-radius: 0;
    border-left: none;
    border-right: none;
    padding: 10px 12px;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
  }
`;

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  @media (max-width: 720px) {
    justify-self: center;
    gap: 8px;
  }
`;

const BrandMark = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #fff;
  display: grid;
  place-items: center;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.12);
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 30px;
    height: 30px;
    object-fit: contain;
  }

  @media (max-width: 720px) {
    width: 34px;
    height: 34px;

    img {
      width: 24px;
      height: 24px;
    }
  }
`;

const BrandText = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

const BrandName = styled.span`
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.1;

  @media (max-width: 720px) {
    font-size: 0.95rem;
  }
`;

const BrandSub = styled.span`
  color: var(--color-muted);
  font-size: 0.8rem;
  letter-spacing: 0.02em;

  @media (max-width: 720px) {
    display: none;
  }
`;

const HeaderLinks = styled.nav`
  display: flex;
  align-items: center;
  gap: 30px;
  margin-left: auto;
  color: rgba(26, 34, 48, 0.86);
  font-size: 0.92rem;

  a {
    white-space: nowrap;
  }

  @media (max-width: 1100px) {
    gap: 18px;
  }

  @media (max-width: 960px) {
    order: 3;
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    margin-left: 0;
  }

  @media (max-width: 720px) {
    display: none;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 720px) {
    justify-self: end;
  }
`;

const MobileMenuButton = styled.button`
  display: none;

  @media (max-width: 720px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: var(--color-text);
    padding: 0;
    cursor: pointer;
    justify-self: start;

    svg {
      width: 24px;
      height: 24px;
    }
  }
`;

const LanguageTrigger = styled.button`
  border: none;
  background: transparent;
  color: #fff;
  padding: 0;
  font-size: 2rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  text-shadow: 0 6px 18px rgba(15, 23, 42, 0.24);

  @media (max-width: 720px) {
    font-size: 1.55rem;
    text-shadow: none;
  }
`;

const MobileMenuOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 22, 0.5);
  z-index: 115;
  display: none;

  @media (max-width: 720px) {
    display: grid;
    align-items: start;
  }
`;

const MobileMenuDrawer = styled.div`
  width: 100%;
  max-height: min(72vh, 480px);
  background: #fff;
  box-shadow: 0 26px 50px rgba(15, 23, 42, 0.18);
  padding: 18px 18px 20px;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 18px;
  border-radius: 0 0 24px 24px;
  overflow-y: auto;
`;

const MobileMenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MobileMenuTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const MobileMenuLinks = styled.nav`
  display: grid;
  gap: 6px;

  a {
    padding: 12px 2px;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    font-size: 0.95rem;
    font-weight: 600;
  }
`;

const LanguageOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 22, 0.64);
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 24px;

  @media (max-width: 720px) {
    padding: 0;
  }
`;

const LanguageDialog = styled.div`
  width: min(480px, 100%);
  max-height: min(78vh, 720px);
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.28);
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;

  @media (max-width: 720px) {
    width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
  }
`;

const LanguageDialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
`;

const LanguageDialogTitle = styled.h3`
  margin: 0;
  font-size: 1.15rem;
`;

const LanguageClose = styled.button`
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-outline);
  border-radius: 999px;
  background: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  color: var(--color-text);
`;

const LanguageList = styled.div`
  overflow-y: auto;
  padding: 10px 14px 18px;
`;

const LanguageOption = styled.button<{ $active: boolean }>`
  width: 100%;
  border: 1px solid ${(props) => (props.$active ? "rgba(235, 35, 64, 0.28)" : "rgba(15, 23, 42, 0.08)")};
  background: ${(props) => (props.$active ? "rgba(235, 35, 64, 0.06)" : "#fff")};
  border-radius: 18px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  cursor: pointer;
  margin-bottom: 10px;
  text-align: left;
`;

const LanguageOptionMain = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const LanguageFlag = styled.span`
  font-size: 1.35rem;
  line-height: 1;
`;

const LanguageMeta = styled.div`
  display: grid;
  gap: 2px;
`;

const LanguageName = styled.span`
  font-weight: 700;
  color: var(--color-text);
`;

const LanguageLabel = styled.span`
  font-size: 0.85rem;
  color: var(--color-muted);
`;

const LanguageCheck = styled.span<{ $active: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 2px solid ${(props) => (props.$active ? "var(--color-primary)" : "rgba(15, 23, 42, 0.16)")};
  background: ${(props) => (props.$active ? "var(--color-primary)" : "transparent")};
  flex-shrink: 0;
`;

const HeroSection = styled.section`
  position: relative;
  min-height: 520px;
  padding: 23px 44px 86px;
  border-radius: 0 0 0 0;
  overflow: visible;
  background:
    linear-gradient(90deg, rgba(18, 18, 18, 0.78) 0%, rgba(18, 18, 18, 0.15) 12%, rgba(18, 18, 18, 0.1) 100%),
    radial-gradient(circle at 20% 72%, rgba(255, 68, 73, 0.95), rgba(255, 68, 73, 0) 34%),
    radial-gradient(circle at 78% 34%, rgba(111, 24, 29, 0.58), rgba(111, 24, 29, 0) 28%),
    repeating-linear-gradient(
      90deg,
      rgba(18, 6, 8, 0.88) 0 3px,
      rgba(94, 27, 31, 0.95) 3px 22px
    );
  box-shadow: 0 28px 54px rgba(15, 23, 42, 0.14);

  @media (max-width: 960px) {
    min-height: 460px;
    padding: 23px 24px 112px;
  }

  @media (max-width: 720px) {
    border-radius: 0;
    padding: 21px 16px 144px;
    min-height: 420px;
  }
`;

const DealTabsWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 72px;

  @media (max-width: 720px) {
    margin-bottom: 28px;
  }
`;

const DealTabs = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
`;

const DealTab = styled.button<{ $active: boolean }>`
  border: none;
  border-radius: 999px;
  padding: 12px 22px;
  background: ${(props) => (props.$active ? "var(--color-primary)" : "transparent")};
  color: ${(props) => (props.$active ? "#fff" : "var(--color-text)")};
  font-weight: 700;
  font-size: 0.92rem;
  cursor: pointer;

  @media (max-width: 720px) {
    padding: 10px 16px;
    font-size: 0.82rem;
  }
`;

const HeroBody = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
`;

const HeroCopy = styled.div`
  max-width: 520px;
  color: #fff;
`;

const HeroTitle = styled.h1`
  margin: 0;
  font-size: clamp(3rem, 5vw, 4.4rem);
  line-height: 0.95;
  font-weight: 700;
  letter-spacing: -0.04em;

  @media (max-width: 720px) {
    font-size: 2.4rem;
    line-height: 1;
    max-width: 300px;
  }
`;

const SearchDock = styled.div`
  position: absolute;
  left: 46px;
  right: 46px;
  bottom: 0;
  transform: translateY(64%);

  @media (max-width: 960px) {
    left: 24px;
    right: 24px;
  }

  @media (max-width: 720px) {
    left: 16px;
    right: 16px;
  }
`;

const SearchPanel = styled.form`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(180px, 0.9fr) 60px 128px;
  align-items: center;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 14px;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.16);
  overflow: hidden;

  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr) minmax(150px, 0.9fr) 56px 112px;
  }

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr) 48px 48px 48px;
    border-radius: 18px;
    overflow: hidden;
    padding: 0;
    gap: 0;
  }
`;

const SearchSegment = styled.div`
  position: relative;
  min-width: 0;

  &:not(:last-child)::after {
    content: "";
    position: absolute;
    top: 18px;
    right: 0;
    bottom: 18px;
    width: 1px;
    background: rgba(235, 35, 64, 0.42);
  }

  @media (max-width: 720px) {
    &:not(:last-child)::after {
      display: block;
      top: 10px;
      bottom: 10px;
    }
  }
`;

const SearchInputWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  min-height: 54px;

  @media (max-width: 720px) {
    min-height: 46px;
    padding: 0 12px;
    gap: 8px;
  }
`;

const SearchIconWrap = styled.span`
  display: inline-flex;
  color: var(--color-muted);
  flex-shrink: 0;
`;

const SearchInput = styled.input`
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: 0.95rem;

  @media (max-width: 720px) {
    font-size: 0.82rem;
  }
`;

const SearchSelectButton = styled.button`
  width: 100%;
  min-height: 54px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: 0.95rem;
  padding: 0 36px 0 16px;
  text-align: left;
  cursor: pointer;

  .mobile-location-icon {
    display: none;
  }

  @media (max-width: 720px) {
    min-height: 46px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    .mobile-location-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary);

      svg {
        display: block;
        width: 18px;
        height: 18px;
      }
    }
  }
`;

const SearchSelectWrap = styled.div`
  position: relative;

  svg {
    display: none;
  }

  @media (max-width: 720px) {
    display: grid;
    place-items: center;

    svg {
      display: none;
    }
  }
`;

const SearchSelectText = styled.span<{ $placeholder?: boolean }>`
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${(props) => (props.$placeholder ? "var(--color-muted)" : "var(--color-text)")};

  @media (max-width: 720px) {
    display: none;
  }
`;

const FilterButton = styled.button`
  position: relative;
  width: 100%;
  min-height: 54px;
  border: none;
  background: transparent;
  color: var(--color-primary);
  display: grid;
  place-items: center;
  cursor: pointer;

  @media (max-width: 720px) {
    min-height: 46px;
  }
`;

const FilterActiveDot = styled.span`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--color-primary);
  box-shadow: 0 0 0 2px #fff;
`;

const SearchButton = styled.button`
  border: none;
  min-height: 54px;
  margin: 6px;
  border-radius: 10px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  @media (max-width: 720px) {
    margin: 0;
    min-height: 46px;
    border-radius: 0;
    padding: 0;

    span {
      display: none;
    }
  }
`;

const Content = styled.main`
  padding-top: 66px;

  @media (max-width: 720px) {
    padding-top: 52px;
  }
`;

const Section = styled.section`
  max-width: 1160px;
  margin: 0 auto;
  padding: 0 12px;
`;

const CategorySection = styled(Section)`
  margin-top: 18px;
  margin-bottom: 28px;

  @media (max-width: 720px) {
    margin-top: 0;
    margin-bottom: 14px;
  }
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 26px;
  align-items: center;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const CategoryLabel = styled.h2`
  margin: 0;
  font-size: 1.7rem;
  line-height: 1;
  color: #3b3640;

  @media (max-width: 960px) {
    font-size: 1.35rem;
  }
`;

const CategoryCardsWrap = styled.div`
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 72px;
    pointer-events: none;
    background: linear-gradient(90deg, rgba(245, 246, 250, 0), rgba(245, 246, 250, 0.96) 70%);
  }

  @media (max-width: 960px) {
    &::after {
      width: 48px;
    }
  }
`;

const CategoryCards = styled.div`
  display: flex;
  gap: 18px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 22px 6px 0;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const CategoryCard = styled.button<{ $active: boolean; $background: string }>`
  position: relative;
  flex: 0 0 calc((100% - 54px) / 4);
  max-width: calc((100% - 54px) / 4);
  height: 96px;
  border-radius: 12px;
  border: 2px solid ${(props) => (props.$active ? "var(--color-primary)" : "rgba(235, 35, 64, 0.42)")};
  overflow: hidden;
  cursor: pointer;
  background:
    linear-gradient(180deg, rgba(18, 18, 18, 0.04), rgba(18, 18, 18, 0.78)),
    ${(props) => props.$background};
  background-size: cover;
  background-position: center;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);

  span {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 10px;
    color: #fff;
    font-weight: 700;
    text-align: center;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 720px) {
    flex-basis: 188px;
    max-width: 188px;
    height: 92px;
  }
`;

const ListingSection = styled(Section)`
  display: grid;
  gap: 16px;
  padding-bottom: 40px;

  @media (max-width: 720px) {
    padding-bottom: 88px;
  }
`;

const LoadMoreText = styled.p`
  margin: 8px 0 0;
  color: var(--color-muted);
`;

const LoadMoreButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 999px;
  padding: 10px 18px;
  background: #fff;
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  margin: 12px auto 0;
  display: block;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadMoreSentinel = styled.div`
  height: 1px;
`;

const DesktopFooter = styled.footer`
  margin-top: auto;
  background: var(--color-primary);
  color: #fff;

  @media (max-width: 720px) {
    display: none;
  }
`;

const FooterInner = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 10px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  font-size: 0.82rem;
`;

const FooterLinks = styled.nav`
  display: flex;
  align-items: center;
  gap: 30px;

  a {
    color: #fff;
    opacity: 0.95;
  }
`;

const MobileFloatActions = styled.div`
  display: none;

  @media (max-width: 720px) {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    z-index: 45;
    display: grid;
    grid-template-columns: 44px 1fr 44px;
    align-items: center;
    gap: 12px;
    pointer-events: none;
  }
`;

const DesktopFloatActions = styled.div`
  position: fixed;
  left: 50%;
  bottom: 62px;
  transform: translateX(-50%);
  width: min(1040px, calc(100vw - 120px));
  pointer-events: none;
  z-index: 40;

  @media (max-width: 720px) {
    display: none;
  }
`;

const DesktopFloatActionLeft = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
`;

const DesktopFloatActionCenter = styled.div`
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
`;

const DesktopFloatActionRight = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
`;

const FloatCircleButton = styled.button`
  width: 52px;
  height: 52px;
  border: none;
  border-radius: 999px;
  background: var(--color-primary);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 18px 34px rgba(235, 35, 64, 0.28);
  cursor: pointer;
  pointer-events: auto;

  svg {
    width: 26px;
    height: 26px;
  }

  @media (max-width: 720px) {
    width: 44px;
    height: 44px;
    box-shadow: 0 14px 26px rgba(235, 35, 64, 0.26);

    svg {
      width: 22px;
      height: 22px;
    }
  }
`;

const FloatPillButton = styled.button`
  min-height: 52px;
  border: none;
  border-radius: 999px;
  padding: 0 28px;
  background: var(--color-primary);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 18px 34px rgba(235, 35, 64, 0.28);
  cursor: pointer;
  pointer-events: auto;

  svg {
    width: 20px;
    height: 20px;
  }

  @media (max-width: 720px) {
    min-height: 44px;
    padding: 0 18px;
    font-size: 0.95rem;
    box-shadow: 0 14px 26px rgba(235, 35, 64, 0.26);

    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const LocationOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 22, 0.64);
  z-index: 110;
  display: grid;
  place-items: center;
  padding: 24px;

  @media (max-width: 720px) {
    padding: 18px;
  }
`;

const LocationDialog = styled.div`
  width: min(560px, 100%);
  max-height: min(82vh, 760px);
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.28);
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;

  @media (max-width: 720px) {
    width: min(520px, 100%);
    max-height: min(72vh, 620px);
    border-radius: 22px;
  }
`;

const LocationHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
`;

const LocationTitle = styled.h3`
  margin: 0;
  font-size: 1.15rem;
`;

const LocationBody = styled.div`
  overflow-y: auto;
  padding: 18px 20px;
  display: grid;
  gap: 14px;
`;

const LocationFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 16px 20px 20px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
`;

const FilterOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(12, 18, 36, 0.45);
  display: grid;
  place-items: center;
  z-index: 80;
  padding: 16px;

  @media (max-width: 720px) {
    padding: 0;
    align-items: stretch;
  }
`;

const FilterCard = styled.div`
  width: min(520px, 100%);
  background: var(--color-surface);
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--shadow-soft);
  display: grid;
  gap: 14px;

  @media (max-width: 720px) {
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
    overflow-y: auto;
  }
`;

const FilterHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const FilterTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const FilterClose = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 999px;
  padding: 6px 10px;
  background: var(--color-surface);
  cursor: pointer;
  font-weight: 600;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
`;

const FilterField = styled.div`
  display: grid;
  gap: 8px;
`;

const RangeRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`;

const RangeInput = styled.input`
  width: 100%;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-outline);
  padding: 10px 12px;
  background: var(--color-surface);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
`;

const FilterLabel = styled.span`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
  font-weight: 700;
`;

const FilterFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const ApplyButton = styled.button`
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  padding: 10px 16px;
  background: var(--gradient);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--frame-shadow);
`;

const ClearTextButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 999px;
  padding: 8px 12px;
  background: transparent;
  cursor: pointer;
  color: var(--color-muted);
  font-weight: 600;
`;

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const heroTabs = [
  { key: "buy", label: "BUY", dealType: "sale" },
  { key: "rent", label: "RENT", dealType: "rent" },
] as const;

const navLinks = [
  { label: "Articles", href: "/faq" },
  { label: "Our Partners", href: "#partners" },
  { label: "Collections", href: "#collections" },
];

const footerLinks = [
  { label: "Partners", href: "#partners" },
  { label: "Support", href: "/faq" },
  { label: "About Us", href: "/terms" },
  { label: "Agent", href: "/vendor" },
  { label: "Contact Us", href: "/privacy" },
];

const propertyCards = [
  {
    key: "apartment",
    labelKey: "property.apartment",
    imageUrl:
      "https://images.pexels.com/photos/24820908/pexels-photo-24820908.jpeg?cs=srgb&dl=pexels-oleksandr-plakhota-1270583835-24820908.jpg&fm=jpg",
    fallback: "linear-gradient(135deg, #29486e, #19202c 62%, #5a85bf)",
  },
  {
    key: "house",
    labelKey: "property.house",
    imageUrl:
      "https://images.pexels.com/photos/20336641/pexels-photo-20336641.jpeg?cs=srgb&dl=pexels-faruktokluoglu-20336641.jpg&fm=jpg",
    fallback: "linear-gradient(135deg, #8b7746, #4f3c1e 55%, #c49f65)",
  },
  {
    key: "mini_condo",
    labelKey: "property.miniCondo",
    imageUrl:
      "https://images.pexels.com/photos/29174517/pexels-photo-29174517.jpeg?cs=srgb&dl=pexels-shox-29174517.jpg&fm=jpg",
    fallback: "linear-gradient(135deg, #7ba3b2, #325766 58%, #bccdd5)",
  },
  {
    key: "condo",
    labelKey: "property.condo",
    imageUrl:
      "https://images.pexels.com/photos/35818904/pexels-photo-35818904.jpeg?cs=srgb&dl=pexels-sue-hsu-721218065-35818904.jpg&fm=jpg",
    fallback: "linear-gradient(135deg, #d2d4d7, #5f646a 58%, #f0f1f3)",
  },
  {
    key: "land",
    labelKey: "property.land",
    imageUrl:
      "https://images.pexels.com/photos/10059365/pexels-photo-10059365.jpeg?cs=srgb&dl=pexels-vladimir-sladek-127740023-10059365.jpg&fm=jpg",
    fallback: "linear-gradient(135deg, #7d9662, #465831 58%, #c5d1a3)",
  },
] as const;

const HOME_COPY: Record<string, string> = {
  "site.tagline": "Myanmar real estate marketplace",
  "home.searchPlaceholder": "Search by title, township, district, or city",
  "home.filters": "Filters",
  "home.clear": "Clear",
  "home.loadMore": "Load more",
  "home.loadingMore": "Loading more...",
  "filter.apply": "Apply",
  "filter.area": "Area (sq ft)",
  "filter.bathrooms": "Bathrooms",
  "filter.bedrooms": "Bedrooms",
  "filter.district": "District",
  "filter.max": "Max",
  "filter.min": "Min",
  "filter.priceRange": "Price range",
  "filter.state": "State / Region",
  "filter.township": "Township",
  "property.apartment": "Apartment",
  "property.house": "House",
  "property.miniCondo": "Mini condo",
  "property.condo": "Condo",
  "property.land": "Land",
};

export function HomePageClient() {
  const router = useRouter();
  const t = (key: string) => HOME_COPY[key] ?? key;
  const { user, profileRole, profileReady, loading: authLoading } = useAppState();
  const { language, setLanguage } = useLanguage();
  const params = useSearchParams();
  const initialQuery = params.get("q") ?? "";
  const initialDealType = params.get("deal") ?? "";
  const initialPropertyType = params.get("type") ?? "";
  const initialStateRegion = params.get("state") ?? "";
  const initialDistrict = params.get("district") ?? "";
  const initialTownship = params.get("township") ?? "";
  const initialMinPrice = params.get("minPrice") ?? "";
  const initialMaxPrice = params.get("maxPrice") ?? "";
  const initialBedrooms = params.get("beds") ?? "";
  const initialBathrooms = params.get("baths") ?? "";
  const initialMinArea = params.get("minArea") ?? "";
  const initialMaxArea = params.get("maxArea") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [searchDraft, setSearchDraft] = useState(initialQuery);
  const [dealType, setDealType] = useState(initialDealType);
  const [propertyType, setPropertyType] = useState(initialPropertyType);
  const [stateRegion, setStateRegion] = useState(initialStateRegion);
  const [district, setDistrict] = useState(initialDistrict);
  const [township, setTownship] = useState(initialTownship);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [bedrooms, setBedrooms] = useState(initialBedrooms);
  const [bathrooms, setBathrooms] = useState(initialBathrooms);
  const [minArea, setMinArea] = useState(initialMinArea);
  const [maxArea, setMaxArea] = useState(initialMaxArea);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingMinPrice, setPendingMinPrice] = useState(initialMinPrice);
  const [pendingMaxPrice, setPendingMaxPrice] = useState(initialMaxPrice);
  const [pendingBedrooms, setPendingBedrooms] = useState(initialBedrooms);
  const [pendingBathrooms, setPendingBathrooms] = useState(initialBathrooms);
  const [pendingMinArea, setPendingMinArea] = useState(initialMinArea);
  const [pendingMaxArea, setPendingMaxArea] = useState(initialMaxArea);
  const [dealTab, setDealTab] = useState<"buy" | "rent">(
    initialDealType === "rent" ? "rent" : "buy"
  );
  const [languageOpen, setLanguageOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationStateDraft, setLocationStateDraft] = useState(initialStateRegion);
  const [locationDistrictDraft, setLocationDistrictDraft] = useState(initialDistrict);
  const [locationTownshipDraft, setLocationTownshipDraft] = useState(initialTownship);
  const hasAppliedFilters =
    Boolean(propertyType) ||
    Boolean(stateRegion.trim()) ||
    Boolean(district.trim()) ||
    Boolean(township.trim()) ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    Boolean(bedrooms) ||
    Boolean(bathrooms) ||
    Boolean(minArea) ||
    Boolean(maxArea);

  const filters = useMemo(
    () => ({
      query,
      dealType: dealType || undefined,
      propertyType: propertyType || undefined,
      stateRegion: stateRegion || undefined,
      district: district || undefined,
      township: township || undefined,
      minPrice: minPrice ? toNumber(minPrice) : undefined,
      maxPrice: maxPrice ? toNumber(maxPrice) : undefined,
      bedrooms: bedrooms ? toNumber(bedrooms) : undefined,
      bathrooms: bathrooms ? toNumber(bathrooms) : undefined,
      minAreaSqft: minArea ? toNumber(minArea) : undefined,
      maxAreaSqft: maxArea ? toNumber(maxArea) : undefined,
    }),
    [
      bathrooms,
      bedrooms,
      dealType,
      district,
      maxArea,
      maxPrice,
      minArea,
      minPrice,
      propertyType,
      query,
      stateRegion,
      township,
    ]
  );

  const { listings, loading, loadingMore, hasMore, loadMore } = useInfiniteListings(filters);
  const stateOptions = useMemo(() => getStates(), []);
  const locationDistrictOptions = useMemo(
    () => (locationStateDraft ? getDistricts(locationStateDraft) : []),
    [locationStateDraft]
  );
  const locationTownshipOptions = useMemo(
    () =>
      locationStateDraft && locationDistrictDraft
        ? getTownships(locationStateDraft, locationDistrictDraft)
        : [],
    [locationDistrictDraft, locationStateDraft]
  );
  const showBedBathFilters = useMemo(
    () => isBedBathPropertyType(propertyType),
    [propertyType]
  );
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const languageOptions = [
    { value: "en", flag: "🇬🇧", name: "English", label: "Eng" },
    { value: "mm", flag: "🇲🇲", name: "Myanmar", label: "မြန်မာ" },
    { value: "zh", flag: "🇨🇳", name: "Chinese", label: "中文" },
    { value: "th", flag: "🇹🇭", name: "Thai", label: "ไทย" },
  ] as const;

  const activeLanguage =
    languageOptions.find((option) => option.value === language) ?? languageOptions[0];

  const locationSummary = [stateRegion, district, township].filter(Boolean).join(" / ");
  const resolvedAccount = useMemo(
    () =>
      resolveHeaderAccountPresentation({
        user,
        profileRole,
        profileReady,
        loading: authLoading,
      }),
    [authLoading, profileReady, profileRole, user]
  );
  const accountLabel = resolvedAccount.label;
  const accountHref = resolvedAccount.href;

  useEffect(() => {
    if (!showBedBathFilters) {
      setPendingBedrooms("");
      setPendingBathrooms("");
    }
  }, [showBedBathFilters]);

  useEffect(() => {
    if (!hasMore || loading) return;
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "220px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextParams = new URLSearchParams();
    if (query.trim()) nextParams.set("q", query.trim());
    if (dealType) nextParams.set("deal", dealType);
    if (propertyType) nextParams.set("type", propertyType);
    if (stateRegion.trim()) nextParams.set("state", stateRegion.trim());
    if (district.trim()) nextParams.set("district", district.trim());
    if (township.trim()) nextParams.set("township", township.trim());
    if (minPrice) nextParams.set("minPrice", minPrice);
    if (maxPrice) nextParams.set("maxPrice", maxPrice);
    if (bedrooms) nextParams.set("beds", bedrooms);
    if (bathrooms) nextParams.set("baths", bathrooms);
    if (minArea) nextParams.set("minArea", minArea);
    if (maxArea) nextParams.set("maxArea", maxArea);
    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `/?${nextQuery}` : "/";
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (currentUrl !== nextUrl) {
      router.replace(nextUrl);
    }
  }, [
    bathrooms,
    bedrooms,
    dealType,
    district,
    maxArea,
    maxPrice,
    minArea,
    minPrice,
    propertyType,
    query,
    router,
    stateRegion,
    township,
  ]);

  const submitHeroSearch = () => {
    setQuery(searchDraft);
  };

  return (
    <>
      <PageFrame>
        <Page>
          <Shell>
            <Header>
              <HeaderInner>
                <MobileMenuButton
                  type="button"
                  aria-label="Open navigation menu"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu />
                </MobileMenuButton>
                <Brand href="/">
                  <BrandMark>
                    <img src="/KTLogo.png" alt="Eain Chan Myay logo" />
                  </BrandMark>
                  <BrandText>
                    <BrandName>EainChanMyay.com</BrandName>
                    <BrandSub>{t("site.tagline")}</BrandSub>
                  </BrandText>
                </Brand>
                <HeaderLinks>
                  {navLinks.map((item) => (
                    <Link key={item.label} href={item.href}>
                      {item.label}
                    </Link>
                  ))}
                  <Link href={accountHref}>{accountLabel}</Link>
                </HeaderLinks>
                <HeaderActions>
                  <LanguageTrigger
                    type="button"
                    aria-label="Open language selector"
                    onClick={() => setLanguageOpen(true)}
                  >
                    {activeLanguage.flag}
                  </LanguageTrigger>
                </HeaderActions>
              </HeaderInner>
            </Header>

            <HeroSection>
              <DealTabsWrap>
                <DealTabs>
                  {heroTabs.map((tab) => (
                    <DealTab
                      key={tab.key}
                      type="button"
                      $active={dealTab === tab.key}
                      onClick={() => {
                        setDealTab(tab.key);
                        setDealType(tab.dealType);
                      }}
                    >
                      {tab.label}
                    </DealTab>
                  ))}
                </DealTabs>
              </DealTabsWrap>

              <HeroBody>
                <HeroCopy>
                  <HeroTitle>
                    Easy way to find
                    <br />
                    a perfect property
                  </HeroTitle>
                </HeroCopy>
              </HeroBody>

              <SearchDock>
                <SearchPanel
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitHeroSearch();
                  }}
                >
                  <SearchSegment>
                    <SearchInputWrap>
                      <SearchIconWrap>
                        <Search size={16} />
                      </SearchIconWrap>
                      <SearchInput
                        placeholder={t("home.searchPlaceholder")}
                        value={searchDraft}
                        onChange={(event) => setSearchDraft(event.target.value)}
                      />
                    </SearchInputWrap>
                  </SearchSegment>

                  <SearchSegment>
                    <SearchSelectWrap>
                    <SearchSelectButton
                      type="button"
                      aria-label="Select location"
                        onClick={() => {
                          setLocationStateDraft(stateRegion);
                          setLocationDistrictDraft(district);
                          setLocationTownshipDraft(township);
                          setLocationOpen(true);
                        }}
                    >
                      <SearchSelectText $placeholder={!locationSummary}>
                        {locationSummary || "Select Location"}
                      </SearchSelectText>
                      <span className="mobile-location-icon" aria-hidden="true">
                        <MapPin size={18} />
                      </span>
                    </SearchSelectButton>
                  </SearchSelectWrap>
                </SearchSegment>

                  <SearchSegment>
                    <FilterButton
                      type="button"
                      aria-label={t("home.filters")}
                      onClick={() => {
                        setPendingMinPrice(minPrice);
                        setPendingMaxPrice(maxPrice);
                        setPendingBedrooms(bedrooms);
                        setPendingBathrooms(bathrooms);
                        setPendingMinArea(minArea);
                        setPendingMaxArea(maxArea);
                        setFiltersOpen(true);
                      }}
                    >
                      <SlidersHorizontal size={18} />
                      {hasAppliedFilters && <FilterActiveDot aria-hidden="true" />}
                    </FilterButton>
                  </SearchSegment>

                <SearchButton type="submit">
                  <Search size={14} />
                  <span>Search</span>
                </SearchButton>
                </SearchPanel>
              </SearchDock>
            </HeroSection>

            <Content>
              <CategorySection id="collections">
                <CategoryGrid>
                  <CategoryLabel>Property Type</CategoryLabel>
                  <CategoryCardsWrap>
                    <CategoryCards>
                      {propertyCards.map((card) => (
                        <CategoryCard
                          key={card.key}
                          type="button"
                          $active={propertyType === card.key}
                          $background={card.imageUrl ? `url("${card.imageUrl}")` : card.fallback}
                          onClick={() => {
                            setPropertyType((current) => (current === card.key ? "" : card.key));
                          }}
                        >
                          <span>{t(card.labelKey)}</span>
                        </CategoryCard>
                      ))}
                    </CategoryCards>
                  </CategoryCardsWrap>
                </CategoryGrid>
              </CategorySection>

              <ListingSection>
                <ListingGrid listings={listings} loading={loading} />
                {loadingMore && <LoadMoreText>{t("home.loadingMore")}</LoadMoreText>}
                {!loading && hasMore && (
                  <LoadMoreButton type="button" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? t("home.loadingMore") : t("home.loadMore")}
                  </LoadMoreButton>
                )}
                {hasMore && !loading && <LoadMoreSentinel ref={loadMoreRef} />}
              </ListingSection>
            </Content>
          </Shell>

          <MobileFloatActions aria-hidden="true">
            <FloatCircleButton type="button" aria-label="Add">
              <Plus />
            </FloatCircleButton>
            <FloatPillButton type="button" aria-label="Show map">
              <span>Show Map</span>
              <Map />
            </FloatPillButton>
            <FloatCircleButton type="button" aria-label="Chat">
              <MessageCircleMore />
            </FloatCircleButton>
          </MobileFloatActions>
        </Page>

        <DesktopFloatActions aria-hidden="true">
          <DesktopFloatActionLeft>
            <FloatCircleButton type="button" aria-label="Add">
              <Plus />
            </FloatCircleButton>
          </DesktopFloatActionLeft>
          <DesktopFloatActionCenter>
            <FloatPillButton type="button" aria-label="Show map">
              <span>Show Map</span>
              <Map />
            </FloatPillButton>
          </DesktopFloatActionCenter>
          <DesktopFloatActionRight>
            <FloatCircleButton type="button" aria-label="Chat">
              <MessageCircleMore />
            </FloatCircleButton>
          </DesktopFloatActionRight>
        </DesktopFloatActions>

        <DesktopFooter>
          <FooterInner>
            <span>© 2023, EainChanMyay.com</span>
            <FooterLinks id="partners">
              {footerLinks.map((item) => (
                <Link key={item.label} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </FooterLinks>
          </FooterInner>
        </DesktopFooter>
      </PageFrame>

      {mobileMenuOpen && (
        <MobileMenuOverlay onClick={() => setMobileMenuOpen(false)}>
          <MobileMenuDrawer onClick={(event) => event.stopPropagation()}>
            <MobileMenuHeader>
              <MobileMenuTitle>Menu</MobileMenuTitle>
              <LanguageClose
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X size={16} />
              </LanguageClose>
            </MobileMenuHeader>
            <MobileMenuLinks>
              {navLinks.map((item) => (
                <Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
              <Link href={accountHref} onClick={() => setMobileMenuOpen(false)}>
                {accountLabel}
              </Link>
            </MobileMenuLinks>
          </MobileMenuDrawer>
        </MobileMenuOverlay>
      )}

      {languageOpen && (
        <LanguageOverlay onClick={() => setLanguageOpen(false)}>
          <LanguageDialog onClick={(event) => event.stopPropagation()}>
            <LanguageDialogHeader>
              <LanguageDialogTitle>Choose language</LanguageDialogTitle>
              <LanguageClose
                type="button"
                aria-label="Close language popup"
                onClick={() => setLanguageOpen(false)}
              >
                <X size={16} />
              </LanguageClose>
            </LanguageDialogHeader>
            <LanguageList>
              {languageOptions.map((option) => (
                <LanguageOption
                  key={option.value}
                  type="button"
                  $active={option.value === language}
                  onClick={() => {
                    setLanguage(option.value);
                    setLanguageOpen(false);
                  }}
                >
                  <LanguageOptionMain>
                    <LanguageFlag>{option.flag}</LanguageFlag>
                    <LanguageMeta>
                      <LanguageName>{option.name}</LanguageName>
                      <LanguageLabel>{option.label}</LanguageLabel>
                    </LanguageMeta>
                  </LanguageOptionMain>
                  <LanguageCheck $active={option.value === language} />
                </LanguageOption>
              ))}
            </LanguageList>
          </LanguageDialog>
        </LanguageOverlay>
      )}

      {locationOpen && (
        <LocationOverlay onClick={() => setLocationOpen(false)}>
          <LocationDialog onClick={(event) => event.stopPropagation()}>
            <LocationHeader>
              <LocationTitle>Select location</LocationTitle>
              <FilterClose
                type="button"
                aria-label="Close location popup"
                onClick={() => setLocationOpen(false)}
              >
                <X size={14} />
              </FilterClose>
            </LocationHeader>
            <LocationBody>
              <FilterField>
                <CustomSelect
                  id="location-state"
                  name="location_state"
                  label={t("filter.state")}
                  value={locationStateDraft}
                  onChange={(value) => {
                    setLocationStateDraft(value);
                    setLocationDistrictDraft("");
                    setLocationTownshipDraft("");
                  }}
                >
                  {stateOptions.map((state) => (
                    <option key={state.pcode} value={state.name_en}>
                      {state.name_en}
                    </option>
                  ))}
                </CustomSelect>
              </FilterField>
              <FilterField>
                <CustomSelect
                  id="location-district"
                  name="location_district"
                  label={t("filter.district")}
                  value={locationDistrictDraft}
                  onChange={(value) => {
                    setLocationDistrictDraft(value);
                    setLocationTownshipDraft("");
                  }}
                  disabled={!locationStateDraft}
                >
                  {locationDistrictOptions.map((item) => (
                    <option key={item.pcode} value={item.name_en}>
                      {item.name_en}
                    </option>
                  ))}
                </CustomSelect>
              </FilterField>
              <FilterField>
                <CustomSelect
                  id="location-township"
                  name="location_township"
                  label={t("filter.township")}
                  value={locationTownshipDraft}
                  onChange={(value) => setLocationTownshipDraft(value)}
                  disabled={!locationDistrictDraft}
                >
                  {locationTownshipOptions.map((item) => (
                    <option key={item.pcode} value={item.name_en}>
                      {item.name_en}
                    </option>
                  ))}
                </CustomSelect>
              </FilterField>
            </LocationBody>
            <LocationFooter>
              <ClearTextButton
                type="button"
                onClick={() => {
                  setLocationStateDraft("");
                  setLocationDistrictDraft("");
                  setLocationTownshipDraft("");
                }}
              >
                {t("home.clear")}
              </ClearTextButton>
              <ApplyButton
                type="button"
                onClick={() => {
                  setStateRegion(locationStateDraft);
                  setDistrict(locationDistrictDraft);
                  setTownship(locationTownshipDraft);
                  setLocationOpen(false);
                }}
              >
                {t("filter.apply")}
              </ApplyButton>
            </LocationFooter>
          </LocationDialog>
        </LocationOverlay>
      )}

      {filtersOpen && (
        <FilterOverlay onClick={() => setFiltersOpen(false)}>
          <FilterCard onClick={(event) => event.stopPropagation()}>
            <FilterHeader>
              <FilterTitle>{t("home.filters")}</FilterTitle>
              <FilterClose
                type="button"
                aria-label="Close filters"
                onClick={() => setFiltersOpen(false)}
              >
                <X size={14} />
              </FilterClose>
            </FilterHeader>
            <FilterField>
              <FilterLabel>{t("filter.priceRange")}</FilterLabel>
              <RangeRow>
                <RangeInput
                  type="number"
                  inputMode="numeric"
                  placeholder={`${t("filter.min")} ${t("filter.priceRange")}`}
                  value={pendingMinPrice}
                  onChange={(event) => setPendingMinPrice(event.target.value)}
                />
                <RangeInput
                  type="number"
                  inputMode="numeric"
                  placeholder={`${t("filter.max")} ${t("filter.priceRange")}`}
                  value={pendingMaxPrice}
                  onChange={(event) => setPendingMaxPrice(event.target.value)}
                />
              </RangeRow>
            </FilterField>
            {showBedBathFilters && (
              <FilterField>
                <FilterLabel>{`${t("filter.bedrooms")} / ${t("filter.bathrooms")}`}</FilterLabel>
                <RangeRow>
                  <RangeInput
                    type="number"
                    inputMode="numeric"
                    placeholder={t("filter.bedrooms")}
                    value={pendingBedrooms}
                    onChange={(event) => setPendingBedrooms(event.target.value)}
                  />
                  <RangeInput
                    type="number"
                    inputMode="numeric"
                    placeholder={t("filter.bathrooms")}
                    value={pendingBathrooms}
                    onChange={(event) => setPendingBathrooms(event.target.value)}
                  />
                </RangeRow>
              </FilterField>
            )}
            <FilterField>
              <FilterLabel>{t("filter.area")}</FilterLabel>
              <RangeRow>
                <RangeInput
                  type="number"
                  inputMode="numeric"
                  placeholder={`${t("filter.min")} ${t("filter.area")}`}
                  value={pendingMinArea}
                  onChange={(event) => setPendingMinArea(event.target.value)}
                />
                <RangeInput
                  type="number"
                  inputMode="numeric"
                  placeholder={`${t("filter.max")} ${t("filter.area")}`}
                  value={pendingMaxArea}
                  onChange={(event) => setPendingMaxArea(event.target.value)}
                />
              </RangeRow>
            </FilterField>
            <FilterFooter>
              <ClearTextButton
                type="button"
                onClick={() => {
                  setPendingMinPrice("");
                  setPendingMaxPrice("");
                  setPendingBedrooms("");
                  setPendingBathrooms("");
                  setPendingMinArea("");
                  setPendingMaxArea("");
                }}
              >
                {t("home.clear")}
              </ClearTextButton>
              <ApplyButton
                type="button"
                onClick={() => {
                  setMinPrice(pendingMinPrice);
                  setMaxPrice(pendingMaxPrice);
                  setBedrooms(pendingBedrooms);
                  setBathrooms(pendingBathrooms);
                  setMinArea(pendingMinArea);
                  setMaxArea(pendingMaxArea);
                  setFiltersOpen(false);
                }}
              >
                {t("home.filters")}
              </ApplyButton>
            </FilterFooter>
          </FilterCard>
        </FilterOverlay>
      )}
    </>
  );
}

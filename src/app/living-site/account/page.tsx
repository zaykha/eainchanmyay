"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  Bath,
  BedDouble,
  Building2,
  Calendar,
  Clock,
  Eye,
  Globe2,
  Heart,
  Home,
  Mail,
  Menu,
  MapPin,
  Plus,
  Ruler,
  Settings,
  ShieldCheck,
  Sparkles,
  Tag as TagIcon,
  Users2,
  X,
} from "lucide-react";
import { useLanguage } from "@/app/living-site/components/Providers";
import { Panel } from "@/app/living-site/components/PageSection";
import { useAppState } from "@/app/living-site/lib/app-state";
import { formatCurrency } from "@/app/living-site/lib/format";
import {
  getInquiriesForUser,
  getSalesRequestsForUser,
  getSavedPropertiesForUser,
  getViewingRequestsForUser,
} from "@/app/living-site/lib/data";
import { useI18n } from "@/app/living-site/lib/i18n";
import { getUpgradePlan, getVendorPlan } from "@/lib/vendor-plans";
import { isVendorStorefrontSetupComplete } from "@/lib/vendor-storefront";
import { formatPropertyTypeValue } from "@/lib/property-types";

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
  max-width: 1280px;
  margin: 0 auto;
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

const HeaderBrand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  @media (max-width: 720px) {
    justify-self: center;
    gap: 8px;
  }
`;

const HeaderBrandMark = styled.div`
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

const HeaderBrandText = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

const HeaderBrandName = styled.span`
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.1;

  @media (max-width: 720px) {
    font-size: 0.95rem;
  }
`;

const HeaderBrandSub = styled.span`
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

const PageShell = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 16px;
  display: grid;
  gap: 16px;
`;

const List = styled.div`
  display: grid;
  gap: 10px;
`;

const ListItem = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 14px;
  padding: 12px 14px;
  background: var(--color-surface);
  display: grid;
  gap: 6px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-soft);
  }
`;

const ListItemGrid = styled(ListItem)`
  grid-template-columns: 92px 1fr;
  align-items: stretch;
  gap: 12px;
  padding: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 84px 1fr;
  }
`;

const ImageCard = styled(ListItemGrid)<{ $image?: string }>`
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    background-image: ${(props) =>
      props.$image
        ? `linear-gradient(90deg, rgba(12, 18, 36, 0.8), rgba(12, 18, 36, 0.6), rgba(12, 18, 36, 0.2)),
           linear-gradient(0deg, rgba(12, 18, 36, 0.45), rgba(12, 18, 36, 0.45)),
           url(${props.$image})`
        : "none"};
    background-size: cover;
    background-position: center;
    position: relative;
    overflow: hidden;
  }
`;

const Thumbnail = styled.div`
  width: 92px;
  height: 100%;
  min-height: 72px;
  border-radius: 10px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  overflow: hidden;
  display: grid;
  place-items: center;
  font-size: 13px;
  color: var(--color-muted);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  @media (max-width: 640px) {
    display: none;
  }
`;

const ItemContent = styled.div`
  display: grid;
  gap: 6px;
`;

const ImageCardContent = styled(ItemContent)`
  @media (max-width: 640px) {
    position: relative;
    z-index: 1;
    color: #fff;

    * {
      color: rgba(255, 255, 255);
    }

    svg {
      color: #fff;
    }
  }
`;

const Muted = styled.p`
  margin: 0;
  color: var(--color-muted);
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const DealPill = styled.span`
  border: 1px solid color-mix(in srgb, var(--color-primary) 40%, transparent);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-muted);
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  color: var(--color-muted);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
`;

const DetailRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
`;

const DetailRowHorizontal = styled(DetailRow)`
  @media (max-width: 640px) {
    flex-direction: row;
    align-items: center;
    gap: 8px 12px;
  }
`;

const IconLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  // color: var(--color-muted);

  svg {
    width: 14px;
    height: 14px;
  }

  @media (max-width: 640px) {
    font-size: 0.75rem;
  }
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Tag = styled.span`
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  color: var(--color-muted);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
`;

const MobileOnly = styled.span`
  display: none;

  @media (max-width: 640px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    flex-direction: column;
    gap: 4px;
    font-size: 0.7rem;
  }
`;

const DesktopOnly = styled.span`
  display: inline-flex;

  @media (max-width: 640px) {
    display: none;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

const ToolbarRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const UtilityLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  width: 42px;
  height: 42px;
  background: var(--color-surface-2);
  color: var(--color-muted);
  font-weight: 600;
  text-decoration: none;
  box-shadow: var(--shadow-soft);

  @media (max-width: 640px) {
    width: 40px;
    height: 40px;
  }
`;

const TabBar = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  box-shadow: var(--shadow-soft);

  @media (max-width: 640px) {
    flex-wrap: nowrap;
    overflow-x: auto;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    justify-content: center;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const TabButton = styled.button<{ $active?: boolean }>`
  border: 1px solid
    ${(props) => (props.$active ? "var(--color-primary)" : "transparent")};
  border-radius: 12px;
  padding: 8px 16px;
  min-width: 140px;
  background: ${(props) =>
    props.$active
      ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
      : "transparent"};
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-muted)")};
  font-weight: 600;
  cursor: pointer;
  position: relative;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 12px;
    box-shadow: ${(props) =>
      props.$active
        ? "0 6px 16px color-mix(in srgb, var(--color-primary) 25%, transparent)"
        : "none"};
  }

  @media (max-width: 640px) {
    min-width: auto;
    padding: 8px 12px;
    white-space: nowrap;
    font-size: 0.8rem;
    gap: 6px;
  }
`;

const TabAction = styled.button`
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  background: var(--gradient);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--frame-shadow);

  @media (max-width: 640px) {
    display: none;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const InlineNotice = styled.div<{ $danger?: boolean }>`
  width: 100%;
  border-radius: 14px;
  border: 1px solid ${(props) => (props.$danger ? "rgba(255, 148, 148, 0.22)" : "rgba(255, 210, 92, 0.22)")};
  background: ${(props) => (props.$danger ? "rgba(255, 148, 148, 0.08)" : "rgba(255, 210, 92, 0.08)")};
  padding: 12px 14px;
  color: ${(props) => (props.$danger ? "#a61c2f" : "#7a5b00")};
  font-size: 0.9rem;
  line-height: 1.5;
`;

const CTAButton = styled.button`
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  background: var(--gradient);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--frame-shadow);
`;

const VendorGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const VendorCard = styled(Panel)`
  display: grid;
  gap: 14px;
`;

const VendorHero = styled.div`
  display: grid;
  gap: 8px;
`;

const VendorTitle = styled.h2`
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2.1rem);
`;

const VendorMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const VendorPill = styled.span<{ $tone?: "success" | "warning" | "neutral" }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid
    ${(props) =>
      props.$tone === "success"
        ? "rgba(16, 185, 129, 0.28)"
        : props.$tone === "warning"
        ? "rgba(245, 158, 11, 0.28)"
        : "var(--color-outline)"};
  background: ${(props) =>
    props.$tone === "success"
      ? "rgba(16, 185, 129, 0.12)"
      : props.$tone === "warning"
      ? "rgba(245, 158, 11, 0.12)"
      : "var(--color-surface-2)"};
  color: ${(props) =>
    props.$tone === "success" ? "#0f766e" : props.$tone === "warning" ? "#b45309" : "var(--color-text)"};
  font-size: 0.82rem;
  font-weight: 700;
`;

const VendorActionGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const VendorAction = styled(Link)`
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  background: var(--color-surface);
  padding: 14px 16px;
  display: grid;
  gap: 6px;
  color: inherit;
  text-decoration: none;
  box-shadow: var(--shadow-soft);
`;

const VendorActionTitle = styled.strong`
  color: var(--color-text);
`;

const VendorActionCopy = styled.span`
  color: var(--color-muted);
  line-height: 1.55;
  font-size: 0.92rem;
`;

const VendorSectionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const StarterHeader = styled.div`
  display: grid;
  gap: 14px;
`;

const StarterGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const StarterStat = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  padding: 14px 16px;
  background: var(--color-surface-2);
  display: grid;
  gap: 8px;
`;

const StarterStatTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--color-muted);

  svg {
    width: 18px;
    height: 18px;
  }
`;

const StarterStatValue = styled.div`
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-text);
`;

const StarterActions = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const StarterAction = styled(Link)`
  border: 1px solid var(--color-outline);
  border-radius: 20px;
  padding: 16px;
  background: var(--color-surface);
  display: grid;
  gap: 14px;
  color: inherit;
  text-decoration: none;
  box-shadow: var(--shadow-soft);
`;

const StarterActionIcon = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  display: grid;
  place-items: center;

  svg {
    width: 20px;
    height: 20px;
  }
`;

const StarterActionLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-weight: 700;
  color: var(--color-text);
`;

const UpgradeCard = styled(Link)`
  border: 1px solid color-mix(in srgb, var(--color-primary) 26%, var(--color-outline));
  border-radius: 24px;
  padding: 18px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--color-primary) 10%, var(--color-surface)) 0%,
    var(--color-surface) 100%
  );
  color: inherit;
  text-decoration: none;
  display: grid;
  gap: 10px;
  box-shadow: var(--shadow-soft);
`;

const FloatingAction = styled.button`
  position: fixed;
  right: 16px;
  bottom: 92px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 999px;
  padding: 12px 16px;
  background: var(--gradient);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--frame-shadow);
  z-index: 30;

  @media (min-width: 641px) {
    display: none;
  }
`;

const CardDivider = styled.div`
  height: 1px;
  background: var(--color-outline);
  opacity: 0.6;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--color-paper) 55%, transparent);
  display: grid;
  place-items: center;
  z-index: 90;
  padding: 16px;
`;

const ModalCard = styled(Panel)`
  max-width: 720px;
  width: min(720px, 94vw);
  display: grid;
  gap: 14px;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
`;

const GhostButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  background: transparent;
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
`;

const formatEnum = (value: unknown) => {
  if (!value) return "";
  return String(value).replace(/_/g, " ");
};

const formatDealTypeLabel = (value: unknown, t: (key: string) => string) => {
  if (!value) return "";
  const lowered = String(value).toLowerCase();
  if (lowered === "sale") return t("listing.forSale");
  if (lowered === "rent") return t("listing.forRent");
  return formatEnum(value);
};

const formatInquiryDealLabel = (value: unknown, t: (key: string) => string) => {
  if (!value) return "";
  const lowered = String(value).toLowerCase();
  if (lowered === "buy") return t("inquiry.buy");
  if (lowered === "rent") return t("inquiry.rent");
  return formatEnum(value);
};

const formatPropertyTypeLabel = (value: unknown, t: (key: string) => string) => {
  return formatPropertyTypeValue(typeof value === "string" ? value : null, t) || formatEnum(value);
};

function AccountHeader({ isVendor }: { isVendor: boolean }) {
  const { user } = useAppState();
  const { t } = useI18n();
  const { language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const navLinks = [
    { label: "Articles", href: "/faq" },
    { label: "Our Partners", href: "/#partners" },
    { label: "Collections", href: "/#collections" },
  ];
  const languageOptions = [
    { value: "en", flag: "🇬🇧", name: "English", label: "Eng" },
    { value: "mm", flag: "🇲🇲", name: "Myanmar", label: "မြန်မာ" },
    { value: "zh", flag: "🇨🇳", name: "Chinese", label: "中文" },
    { value: "th", flag: "🇹🇭", name: "Thai", label: "ไทย" },
  ] as const;
  const activeLanguage =
    languageOptions.find((option) => option.value === language) ?? languageOptions[0];
  const accountLabel = !user ? "Sign in / Register" : isVendor ? "Hub" : "Account";
  const accountHref = !user ? "/auth" : isVendor ? "/hub" : "/account";

  return (
    <>
      <Header>
        <HeaderInner>
          <MobileMenuButton
            type="button"
            aria-label="Open navigation menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu />
          </MobileMenuButton>
          <HeaderBrand href="/">
            <HeaderBrandMark>
              <img src="/KTLogo.png" alt="Eain Chan Myay logo" />
            </HeaderBrandMark>
            <HeaderBrandText>
              <HeaderBrandName>EainChanMyay.com</HeaderBrandName>
              <HeaderBrandSub>{t("site.tagline")}</HeaderBrandSub>
            </HeaderBrandText>
          </HeaderBrand>

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

      {mobileMenuOpen ? (
        <MobileMenuOverlay onClick={() => setMobileMenuOpen(false)}>
          <MobileMenuDrawer onClick={(event) => event.stopPropagation()}>
            <MobileMenuHeader>
              <MobileMenuTitle>Menu</MobileMenuTitle>
              <GhostButton type="button" onClick={() => setMobileMenuOpen(false)}>
                Close
              </GhostButton>
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
      ) : null}

      {languageOpen ? (
        <ModalOverlay onClick={() => setLanguageOpen(false)}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <ModalHeader>
              <div>
                <VendorSectionTitle>{t("settings.language")}</VendorSectionTitle>
                <Muted>Choose the language for your marketplace experience.</Muted>
              </div>
              <GhostButton type="button" onClick={() => setLanguageOpen(false)}>
                Close
              </GhostButton>
            </ModalHeader>
            <VendorActionGrid>
              {languageOptions.map((option) => (
                <GhostButton
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setLanguage(option.value);
                    setLanguageOpen(false);
                  }}
                  style={{
                    borderColor:
                      option.value === language ? "rgba(235, 35, 64, 0.28)" : "var(--color-outline)",
                    background:
                      option.value === language ? "rgba(235, 35, 64, 0.06)" : "transparent",
                  }}
                >
                  {option.flag} {option.name}
                </GhostButton>
              ))}
            </VendorActionGrid>
          </ModalCard>
        </ModalOverlay>
      ) : null}
    </>
  );
}

const formatTimelineLabel = (value: unknown, t: (key: string) => string) => {
  if (!value) return "";
  const raw = String(value);
  const map: Record<string, string> = {
    asap: t("inquiry.timeline.asap"),
    "1-3": t("inquiry.timeline.oneThree"),
    "3-6": t("inquiry.timeline.threeSix"),
    browsing: t("inquiry.timeline.browsing"),
  };
  return map[raw] ?? formatEnum(value);
};

const formatBudgetLabel = (
  value: unknown,
  dealType: unknown,
  t: (key: string) => string
) => {
  if (!value) return "";
  const raw = String(value);
  const isRent = String(dealType ?? "").toLowerCase() === "rent";
  const map = isRent
    ? {
        "0-5": t("inquiry.budget.rent1"),
        "5-10": t("inquiry.budget.rent2"),
        "10-20": t("inquiry.budget.rent3"),
        "20-50": t("inquiry.budget.rent4"),
        "50-100": t("inquiry.budget.rent5"),
        "100+": t("inquiry.budget.rent6"),
      }
    : {
        "0-1000": t("inquiry.budget.buy1"),
        "1000-5000": t("inquiry.budget.buy2"),
        "5000-50000": t("inquiry.budget.buy3"),
        "50000-100000": t("inquiry.budget.buy4"),
        "100000+": t("inquiry.budget.buy5"),
      };
  return map[raw as keyof typeof map] ?? raw;
};

const formatDate = (value: unknown, locale: string) => {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTimeWindow = (value: unknown, t: (key: string) => string) => {
  if (!value) return "";
  const raw = String(value);
  const map: Record<string, string> = {
    "9-12": t("listing.timeWindow.morning"),
    "12-3": t("listing.timeWindow.afternoon"),
    "3-6": t("listing.timeWindow.evening"),
    "6-9": t("listing.timeWindow.night"),
  };
  return map[raw] ?? raw;
};

const formatArea = (value: unknown, locale: string, unitLabel: string) => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return "";
  return `${numeric.toLocaleString(locale)} ${unitLabel}`;
};

function withTimeout<T>(promise: Promise<T>, timeoutMs = 8000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("Request timed out."));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

export default function AccountPage() {
  const { user, loading, profileRole, profileReady, authToken } = useAppState();
  const router = useRouter();
  const pathname = usePathname();
  const { t, language } = useI18n();
  const locale =
    language === "mm" ? "my-MM" : language === "zh" ? "zh-CN" : language === "th" ? "th-TH" : "en-US";
  const [viewingRequests, setViewingRequests] = useState<Array<Record<string, unknown>>>([]);
  const [savedProperties, setSavedProperties] = useState<Array<Record<string, unknown>>>([]);
  const [inquiries, setInquiries] = useState<Array<Record<string, unknown>>>([]);
  const [salesRequests, setSalesRequests] = useState<Array<Record<string, unknown>>>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"viewing" | "saved" | "inquiries" | "sales">(
    "viewing"
  );
  const [activeInquiry, setActiveInquiry] = useState<Record<string, unknown> | null>(null);
  const [activeSale, setActiveSale] = useState<Record<string, unknown> | null>(null);
  const [onboardingPending, setOnboardingPending] = useState(false);
  const [vendorWorkspace, setVendorWorkspace] = useState<{
    vendor: {
      id: string;
      name: string;
      vendor_type: string;
      plan: string | null;
      billing_status?: string | null;
      public_storefront_enabled?: boolean;
      slug?: string | null;
      verified_status?: string | null;
    };
    membership: {
      role: string;
    };
    limits?: {
      currentPlan?: {
        name: string;
      };
      listingCount?: number;
      listingLimit?: number;
      agentCount?: number;
      agentLimit?: number;
    };
  } | null>(null);
  const [vendorWorkspaceError, setVendorWorkspaceError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOnboardingPending(window.localStorage.getItem("kaiten_vendor_onboarding_pending") === "1");
  }, []);

  useEffect(() => {
    if (!profileReady || loading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if ((profileRole === "vendor_user" || onboardingPending || Boolean(vendorWorkspace?.vendor.id)) && pathname === "/account") {
      router.replace("/hub");
      return;
    }
    if (
      profileRole !== "vendor_user" &&
      !onboardingPending &&
      !vendorWorkspace?.vendor.id &&
      pathname === "/hub"
    ) {
      router.replace("/account");
    }
  }, [loading, onboardingPending, pathname, profileReady, profileRole, router, user, vendorWorkspace]);

  useEffect(() => {
    if (!user?.id) return;
    if (profileRole === "vendor_user") return;
    let active = true;
    setDataLoading(true);
    Promise.allSettled([
      withTimeout(getViewingRequestsForUser(user.id)),
      withTimeout(getSavedPropertiesForUser(user.id)),
      withTimeout(getInquiriesForUser(user.id)),
      withTimeout(getSalesRequestsForUser(user.id)),
    ])
      .then((results) => {
        if (!active) return;

        const [requests, saved, inquiryRows, salesRows] = results;

        if (requests.status === "fulfilled") {
          setViewingRequests(requests.value.data);
        } else {
          setViewingRequests([]);
        }

        if (saved.status === "fulfilled") {
          setSavedProperties(saved.value.data);
        } else {
          setSavedProperties([]);
        }

        if (inquiryRows.status === "fulfilled") {
          setInquiries(inquiryRows.value.data);
        } else {
          setInquiries([]);
        }

        if (salesRows.status === "fulfilled") {
          setSalesRequests(salesRows.value.data);
        } else {
          setSalesRequests([]);
        }

        const errors = [
          requests.status === "fulfilled" ? requests.value.error : requests.reason instanceof Error ? requests.reason.message : "Unable to load viewing requests.",
          saved.status === "fulfilled" ? saved.value.error : saved.reason instanceof Error ? saved.reason.message : "Unable to load saved properties.",
          inquiryRows.status === "fulfilled" ? inquiryRows.value.error : inquiryRows.reason instanceof Error ? inquiryRows.reason.message : "Unable to load inquiries.",
          salesRows.status === "fulfilled" ? salesRows.value.error : salesRows.reason instanceof Error ? salesRows.reason.message : "Unable to load property requests.",
        ]
          .filter(Boolean)
          .join(" • ");

        setLoadError(errors || null);
      })
      .finally(() => {
        if (active) setDataLoading(false);
      });

    return () => {
      active = false;
    };
  }, [profileRole, user?.id]);

  useEffect(() => {
    if (!authToken || (!onboardingPending && profileRole !== "vendor_user" && pathname !== "/hub")) return;

    let active = true;
    setVendorWorkspaceError(null);

    fetch("/api/vendor/workspace", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | {
              vendor?: {
                id: string;
                name: string;
                vendor_type: string;
                plan: string | null;
                billing_status?: string | null;
                public_storefront_enabled?: boolean;
                slug?: string | null;
                verified_status?: string | null;
              };
              membership?: { role: string };
              limits?: {
                currentPlan?: { name: string };
                listingCount?: number;
                listingLimit?: number;
                agentCount?: number;
                agentLimit?: number;
              };
              error?: string;
            }
          | null;
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load vendor workspace.");
        }
        if (active) {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("kaiten_vendor_onboarding_pending");
          }
          setOnboardingPending(false);
          setVendorWorkspace(
            payload?.vendor && payload?.membership
              ? {
                  vendor: payload.vendor,
                  membership: payload.membership,
                  limits: payload.limits,
                }
              : null
          );
        }
      })
      .catch((error) => {
        if (active) {
          setVendorWorkspaceError(error instanceof Error ? error.message : "Unable to load vendor workspace.");
        }
      });

    return () => {
      active = false;
    };
  }, [authToken, onboardingPending, pathname, profileRole]);

  const closeDetails = () => {
    setActiveInquiry(null);
    setActiveSale(null);
  };

  const currentVendorPlan = getVendorPlan(vendorWorkspace?.vendor.plan);
  const suggestedUpgrade = getUpgradePlan(vendorWorkspace?.vendor.plan);
  const isFreeAgencyPlan = vendorWorkspace?.vendor.plan === "free";
  const storefrontReady = vendorWorkspace ? isVendorStorefrontSetupComplete(vendorWorkspace.vendor) : false;
  const listingLimit = vendorWorkspace?.limits?.listingLimit ?? currentVendorPlan.listingLimit;
  const listingUsage = vendorWorkspace?.limits?.listingCount ?? 0;
  const agentLimit = vendorWorkspace?.limits?.agentLimit ?? currentVendorPlan.agentLimit;
  const agentUsage = vendorWorkspace?.limits?.agentCount ?? 1;

  const labelize = (value: string | null | undefined) =>
    value
      ? value
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      : "Unknown";

  useEffect(() => {
    if (pathname === "/hub" && vendorWorkspace && !storefrontReady) {
      router.replace("/agency-setup");
    }
  }, [pathname, router, storefrontReady, vendorWorkspace]);

  if (!user && (loading || !profileReady)) {
    return (
      <div>
        <AccountHeader isVendor={false} />
        <PageShell>
          <Muted>{t("account.loading")}</Muted>
        </PageShell>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <AccountHeader isVendor={false} />
        <PageShell>
          <Muted>{t("account.loading")}</Muted>
        </PageShell>
      </div>
    );
  }

  return (
    <div>
      <AccountHeader isVendor={profileRole === "vendor_user"} />
      <PageShell>
        {user && (profileRole === "vendor_user" || onboardingPending || Boolean(vendorWorkspace?.vendor.id)) && (
          <VendorGrid>
            <VendorCard>
              <StarterHeader>
                <VendorTitle>{vendorWorkspace?.vendor.name || "Agency account"}</VendorTitle>
                <VendorMeta>
                  <VendorPill>{vendorWorkspace?.limits?.currentPlan?.name || currentVendorPlan.name}</VendorPill>
                  <VendorPill>{labelize(vendorWorkspace?.membership.role)}</VendorPill>
                  {vendorWorkspace?.vendor.verified_status === "approved" ? (
                    <VendorPill $tone="success">
                      <BadgeCheck size={14} />
                    </VendorPill>
                  ) : null}
                  {vendorWorkspace?.vendor.billing_status && vendorWorkspace.vendor.plan !== "free" ? (
                    <VendorPill $tone={vendorWorkspace.vendor.billing_status === "active" ? "success" : "warning"}>
                      {labelize(vendorWorkspace.vendor.billing_status)}
                    </VendorPill>
                  ) : null}
                </VendorMeta>
              </StarterHeader>

              {vendorWorkspaceError ? <Muted>{vendorWorkspaceError}</Muted> : null}

              {isFreeAgencyPlan ? (
                <>
                  <StarterGrid>
                    <StarterStat>
                      <StarterStatTop>
                        <span>Listings</span>
                        <Building2 />
                      </StarterStatTop>
                      <StarterStatValue>
                        {listingUsage} / {listingLimit}
                      </StarterStatValue>
                    </StarterStat>
                    <StarterStat>
                      <StarterStatTop>
                        <span>Seats</span>
                        <Users2 />
                      </StarterStatTop>
                      <StarterStatValue>
                        {agentUsage} / {agentLimit}
                      </StarterStatValue>
                    </StarterStat>
                    <StarterStat>
                      <StarterStatTop>
                        <span>Storefront</span>
                        <Globe2 />
                      </StarterStatTop>
                      <StarterStatValue>
                        {vendorWorkspace?.vendor.public_storefront_enabled && vendorWorkspace?.vendor.slug
                          ? "Live"
                          : "Draft"}
                      </StarterStatValue>
                    </StarterStat>
                  </StarterGrid>

                  {suggestedUpgrade ? (
                    <UpgradeCard href="/vendor-setup">
                      <VendorMeta>
                        <VendorPill $tone="warning">
                          <Sparkles size={14} />
                          Upgrade
                        </VendorPill>
                      </VendorMeta>
                      <StarterActionLabel>
                        <span>{suggestedUpgrade.name}</span>
                        <ArrowUpRight size={18} />
                      </StarterActionLabel>
                      <Muted>
                        {suggestedUpgrade.listingLimit} listings • {suggestedUpgrade.agentLimit} seats
                      </Muted>
                    </UpgradeCard>
                  ) : null}

                  <StarterActions>
                    <StarterAction href="/request-sale">
                      <StarterActionIcon>
                        <Plus />
                      </StarterActionIcon>
                      <StarterActionLabel>
                        <span>Request Listing</span>
                        <ArrowUpRight size={18} />
                      </StarterActionLabel>
                    </StarterAction>

                    <StarterAction href="/vendor/settings">
                      <StarterActionIcon>
                        <Settings />
                      </StarterActionIcon>
                      <StarterActionLabel>
                        <span>Agency Profile</span>
                        <ArrowUpRight size={18} />
                      </StarterActionLabel>
                    </StarterAction>

                    {vendorWorkspace?.vendor.public_storefront_enabled && vendorWorkspace?.vendor.slug ? (
                      <StarterAction href={`/agency/${vendorWorkspace.vendor.slug}`}>
                        <StarterActionIcon>
                          <Globe2 />
                        </StarterActionIcon>
                        <StarterActionLabel>
                          <span>Public Profile</span>
                          <ArrowUpRight size={18} />
                        </StarterActionLabel>
                      </StarterAction>
                    ) : null}

                    <StarterAction href="/vendor/verification">
                      <StarterActionIcon>
                        <ShieldCheck />
                      </StarterActionIcon>
                      <StarterActionLabel>
                        <span>Verification</span>
                        <ArrowUpRight size={18} />
                      </StarterActionLabel>
                    </StarterAction>
                  </StarterActions>
                </>
              ) : (
                <>
                  <VendorSectionTitle>Workspace</VendorSectionTitle>
                  <VendorActionGrid>
                  <VendorAction href="/vendor">
                    <VendorActionTitle>Dashboard</VendorActionTitle>
                    <VendorActionCopy>
                      Open your agency dashboard, analytics, listings, and lead operations.
                    </VendorActionCopy>
                  </VendorAction>

                    <VendorAction href="/vendor/properties">
                      <VendorActionTitle>Properties</VendorActionTitle>
                      <VendorActionCopy>
                        Review current listings, verification state, and property activity.
                      </VendorActionCopy>
                    </VendorAction>

                    <VendorAction href="/vendor/inquiries">
                      <VendorActionTitle>Lead Inbox</VendorActionTitle>
                      <VendorActionCopy>
                        Handle routed marketplace inquiries, pipeline stages, reminders, and templates.
                      </VendorActionCopy>
                    </VendorAction>

                    <VendorAction href="/vendor/settings">
                      <VendorActionTitle>Settings</VendorActionTitle>
                      <VendorActionCopy>
                        Manage agency profile, storefront branding, workspace preferences, and plan-facing controls.
                      </VendorActionCopy>
                    </VendorAction>
                  </VendorActionGrid>
                </>
              )}
            </VendorCard>

            <VendorCard>
              <VendorSectionTitle>{isFreeAgencyPlan ? "Starter plan" : "Access by role and plan"}</VendorSectionTitle>
              <List>
                <ListItem>
                  <strong>Membership role</strong>
                  <Muted>{labelize(vendorWorkspace?.membership.role)}</Muted>
                </ListItem>
                <ListItem>
                  <strong>Listing capacity</strong>
                  <Muted>
                    {listingUsage} / {listingLimit} listings
                  </Muted>
                </ListItem>
                {!isFreeAgencyPlan ? (
                  <ListItem>
                    <strong>Team capacity</strong>
                    <Muted>
                      {agentUsage} / {agentLimit} seats
                    </Muted>
                  </ListItem>
                ) : null}
                <ListItem>
                  <strong>Public storefront</strong>
                  <Muted>
                    {vendorWorkspace?.vendor.public_storefront_enabled && vendorWorkspace?.vendor.slug
                      ? `Live at /agency/${vendorWorkspace.vendor.slug}`
                      : "Not published yet"}
                  </Muted>
                </ListItem>
              </List>

              <VendorActionGrid>
                {!isFreeAgencyPlan &&
                  (vendorWorkspace?.membership.role === "owner" || vendorWorkspace?.membership.role === "admin") && (
                  <VendorAction href="/vendor/team">
                    <VendorActionTitle>Team</VendorActionTitle>
                    <VendorActionCopy>
                      Manage agents, assignments, and operational seats in this workspace.
                    </VendorActionCopy>
                  </VendorAction>
                )}

                {(vendorWorkspace?.membership.role === "owner" || vendorWorkspace?.membership.role === "admin") && (
                  <VendorAction href="/vendor/verification">
                    <VendorActionTitle>Verification</VendorActionTitle>
                    <VendorActionCopy>
                      Submit or review manual agency verification requirements for this workspace.
                    </VendorActionCopy>
                  </VendorAction>
                )}

                {vendorWorkspace?.vendor.public_storefront_enabled && vendorWorkspace?.vendor.slug ? (
                  <VendorAction href={`/agency/${vendorWorkspace.vendor.slug}`}>
                    <VendorActionTitle>Public Profile</VendorActionTitle>
                    <VendorActionCopy>
                      Open the live storefront buyers see for this agency.
                    </VendorActionCopy>
                  </VendorAction>
                ) : null}

                <VendorAction href="/request-sale">
                  <VendorActionTitle>Request Listing</VendorActionTitle>
                  <VendorActionCopy>
                    Add a new property submission within your current plan limits.
                  </VendorActionCopy>
                </VendorAction>
              </VendorActionGrid>
            </VendorCard>
          </VendorGrid>
        )}

        {profileRole !== "vendor_user" && (
          <>
            {/* <PageSection> */}
              <HeaderRow>
                <ToolbarRow>
                  <TabBar>
                    <TabButton
                      type="button"
                      $active={activeTab === "viewing"}
                      onClick={() => setActiveTab("viewing")}
                    >
                      <DesktopOnly>{t("account.viewing")}</DesktopOnly>
                      <MobileOnly>
                        <Eye size={16} />
                        <span>{t("account.view")}</span>
                      </MobileOnly>
                    </TabButton>
                    <TabButton
                      type="button"
                      $active={activeTab === "saved"}
                      onClick={() => setActiveTab("saved")}
                    >
                      <DesktopOnly>{t("account.saved")}</DesktopOnly>
                      <MobileOnly>
                        <Heart size={16} />
                        <span>{t("account.savedShort")}</span>
                      </MobileOnly>
                    </TabButton>
                    <TabButton
                      type="button"
                      $active={activeTab === "inquiries"}
                      onClick={() => setActiveTab("inquiries")}
                    >
                      <DesktopOnly>{t("account.inquiries")}</DesktopOnly>
                      <MobileOnly>
                        <Mail size={16} />
                        <span>{t("account.inbox")}</span>
                      </MobileOnly>
                    </TabButton>
                    <TabButton
                      type="button"
                      $active={activeTab === "sales"}
                      onClick={() => setActiveTab("sales")}
                    >
                      <DesktopOnly>{t("account.sales")}</DesktopOnly>
                      <MobileOnly>
                        <TagIcon size={16} />
                        <span>{t("account.salesShort")}</span>
                      </MobileOnly>
                    </TabButton>
                  </TabBar>
                  <UtilityLink href="/settings" aria-label="Open settings">
                    <Settings size={16} />
                  </UtilityLink>
                </ToolbarRow>
              </HeaderRow>

              {loading || dataLoading ? (
                <Muted>{t("account.loading")}</Muted>
              ) : loadError ? (
                <Muted style={{ color: "var(--color-danger)" }}>{loadError}</Muted>
              ) : activeTab === "viewing" ? (
                viewingRequests.length ? (
                  <List>
                    {viewingRequests.map((request) => {
                      const property = request.property as Record<string, unknown> | undefined;
                      const propertyId = String(request.property_id ?? property?.id ?? "");
                      const title = (property?.title as string) || t("listing.property");
                      const location = [property?.township, property?.district]
                        .filter(Boolean)
                        .join(", ");
                      const imageUrl = property?.imageUrl as string | undefined;
                      const price = property?.price as number | undefined;
                      const currency = (property?.currency as string) || "MMK";
                      const typeLabel = formatPropertyTypeLabel(property?.property_type, t);
                      const dealLabel = formatDealTypeLabel(property?.deal_type, t);
                      const bedrooms = property?.bedrooms as number | undefined;
                      const bathrooms = property?.bathrooms as number | undefined;
                      const area = formatArea(property?.area_sqft, locale, t("listing.areaSqft"));
                      const requestedDate = formatDate(request.preferred_date, locale);
                      const requestedTime = formatTimeWindow(request.preferred_time_window, t);
                      const requestedLabel = [requestedDate, requestedTime]
                        .filter(Boolean)
                        .join(" | ");
                      const createdAt = formatDate(request.created_at, locale);
                      return (
                        <ImageCard
                          key={String(request.id)}
                          role="button"
                          tabIndex={0}
                          onClick={() => propertyId && router.push(`/listing/${propertyId}`)}
                          onKeyDown={(event) => {
                            if ((event.key === "Enter" || event.key === " ") && propertyId) {
                              event.preventDefault();
                              router.push(`/listing/${propertyId}`);
                            }
                          }}
                          aria-label={`${t("account.view")} ${title}`}
                          $image={imageUrl}
                        >
                          <Thumbnail>
                            {imageUrl ? <img src={imageUrl} alt={title} /> : t("listing.noPhoto")}
                          </Thumbnail>
                          <ImageCardContent>
                            <TitleRow>
                              <TitleGroup>
                                <strong>{title}</strong>
                                {dealLabel ? <DealPill>{dealLabel}</DealPill> : null}
                              </TitleGroup>
                              <DesktopOnly>
                                <StatusRow>
                                  <StatusBadge>
                                    <BadgeCheck size={12} />
                                    {t("account.requested")}
                                  </StatusBadge>
                                  <span>{createdAt || t("account.requestedTbd")}</span>
                                </StatusRow>
                              </DesktopOnly>
                            </TitleRow>
                            <IconLabel>
                              <MapPin />
                              {location || t("account.locationTbd")}
                            </IconLabel>
                            {/* <CardDivider /> */}
                            <DetailRow>
                              <IconLabel>
                                <Calendar />
                                {requestedLabel || t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <TagIcon />
                                {formatCurrency(price, currency) || t("account.requestedTbd")}
                              </IconLabel>
                            </DetailRow>
                            <DetailRowHorizontal>
                              <IconLabel>
                                <Home />
                                {[typeLabel].filter(Boolean).join(" ") || t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <BedDouble />
                                {bedrooms ?? t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <Bath />
                                {bathrooms ?? t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <Ruler />
                                {area || t("account.requestedTbd")}
                              </IconLabel>
                            </DetailRowHorizontal>
                          </ImageCardContent>
                        </ImageCard>
                      );
                    })}
                  </List>
                ) : (
                  <Muted>{t("account.noViewing")}</Muted>
                )
              ) : activeTab === "saved" ? (
                savedProperties.length ? (
                  <List>
                    {savedProperties.map((item) => {
                      const property = item.property as Record<string, unknown> | undefined;
                      const propertyId = String(item.property_id ?? property?.id ?? "");
                      const title = (property?.title as string) || t("listing.property");
                      const price = property?.price as number | undefined;
                      const currency = (property?.currency as string) || "MMK";
                      const location = [property?.township, property?.district]
                        .filter(Boolean)
                        .join(", ");
                      const imageUrl = property?.imageUrl as string | undefined;
                      const typeLabel = formatPropertyTypeLabel(property?.property_type, t);
                      const dealLabel = formatDealTypeLabel(property?.deal_type, t);
                      const bedrooms = property?.bedrooms as number | undefined;
                      const bathrooms = property?.bathrooms as number | undefined;
                      const area = formatArea(property?.area_sqft, locale, t("listing.areaSqft"));
                      const savedAt = formatDate(item.created_at, locale);
                      return (
                        <ImageCard
                          key={String(item.id)}
                          role="button"
                          tabIndex={0}
                          onClick={() => propertyId && router.push(`/listing/${propertyId}`)}
                          onKeyDown={(event) => {
                            if ((event.key === "Enter" || event.key === " ") && propertyId) {
                              event.preventDefault();
                              router.push(`/listing/${propertyId}`);
                            }
                          }}
                          aria-label={`${t("account.view")} ${title}`}
                          $image={imageUrl}
                        >
                          <Thumbnail>
                            {imageUrl ? <img src={imageUrl} alt={title} /> : t("listing.noPhoto")}
                          </Thumbnail>
                          <ImageCardContent>
                            <TitleRow>
                              <TitleGroup>
                                <strong>{title}</strong>
                                {dealLabel ? <DealPill>{dealLabel}</DealPill> : null}
                              </TitleGroup>
                              <DesktopOnly>
                                <StatusRow>
                                  <StatusBadge>
                                    <BadgeCheck size={12} />
                                    {t("account.savedBadge")}
                                  </StatusBadge>
                                  <span>{savedAt || t("account.requestedTbd")}</span>
                                </StatusRow>
                              </DesktopOnly>
                            </TitleRow>
                            <IconLabel>
                              <MapPin />
                              {location || t("account.locationTbd")}
                            </IconLabel>
                            {/* <CardDivider /> */}
                            <DetailRow>
                              <IconLabel>
                                <Calendar />
                                {savedAt || t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <TagIcon />
                                {formatCurrency(price, currency) || t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <Home />
                                {[typeLabel].filter(Boolean).join(" ") || t("account.requestedTbd")}
                              </IconLabel>
                            </DetailRow>
                            <DetailRowHorizontal>
                              <IconLabel>
                                <BedDouble />
                                {bedrooms ?? t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <Bath />
                                {bathrooms ?? t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <Ruler />
                                {area || t("account.requestedTbd")}
                              </IconLabel>
                            </DetailRowHorizontal>
                           
                          </ImageCardContent>
                        </ImageCard>
                      );
                    })}
                  </List>
                ) : (
                  <Muted>{t("account.noSaved")}</Muted>
                )
              ) : activeTab === "inquiries" ? (
                <>
                  <ActionRow>
                    <TabAction type="button" onClick={() => router.push("/inquiries/new")}>
                      {t("account.newInquiry")}
                    </TabAction>
                  </ActionRow>
                  {inquiries.length ? (
                    <List>
                      {inquiries.map((item) => {
                        const needs = [];
                        if (item.need_parking) needs.push(t("account.needParking"));
                        if (item.need_lift) needs.push(t("account.needLift"));
                        if (item.need_solar) needs.push(t("account.needSolar"));
                        if (item.need_generator) needs.push(t("account.needGenerator"));
                        const timeline = formatTimelineLabel(item.timeline, t);
                        const budgetLabel = formatBudgetLabel(item.budget_range, item.deal_type, t);
                        const createdAt = formatDate(item.created_at, locale);
                        return (
                          <ListItem
                            key={String(item.id)}
                            role="button"
                            tabIndex={0}
                            onClick={() => setActiveInquiry(item)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setActiveInquiry(item);
                              }
                            }}
                            aria-label={t("account.viewInquiryDetails")}
                          >
                            <TitleRow>
                              <TitleGroup>
                                <strong>
                                  {formatInquiryDealLabel(item.deal_type, t)}{" "}
                                  {formatPropertyTypeLabel(item.property_type, t)}
                                </strong>
                              </TitleGroup>
                              <StatusRow>
                                <StatusBadge>
                                  <BadgeCheck size={12} />
                                  {t("account.inquiry")}
                                </StatusBadge>
                                <span>{createdAt || t("account.requestedTbd")}</span>
                              </StatusRow>
                            </TitleRow>
                            <IconLabel>
                              <MapPin />
                              {[item.township, item.district, item.state_region]
                                .filter(Boolean)
                                .join(", ") || t("account.locationTbd")}
                            </IconLabel>
                            <CardDivider />
                            <DetailRow>
                              <IconLabel>
                                <TagIcon />
                                {budgetLabel || t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <Clock />
                                {timeline || t("account.requestedTbd")}
                              </IconLabel>
                            </DetailRow>
                            {needs.length ? (
                              <TagRow>
                                {needs.map((need) => (
                                  <Tag key={need}>{need}</Tag>
                                ))}
                              </TagRow>
                            ) : (
                              <Muted>{t("account.noSpecial")}</Muted>
                            )}
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Muted>{t("account.noInquiries")}</Muted>
                  )}
                  <FloatingAction type="button" onClick={() => router.push("/inquiries/new")}>
                    {t("account.newInquiry")}
                  </FloatingAction>
                </>
              ) : (
                <>
                  <ActionRow>
                    <TabAction
                      type="button"
                      onClick={() => router.push("/request-sale")}
                      disabled={salesRequests.length >= 1}
                    >
                      {t("account.newSale")}
                    </TabAction>
                  </ActionRow>
                  <InlineNotice $danger={salesRequests.length >= 1}>
                    {salesRequests.length >= 1
                      ? "1 / 1 property request used. Your existing request is under review before it can be listed."
                      : "You can submit 1 property request from this account. Every request is reviewed before it is listed."}
                  </InlineNotice>
                  {salesRequests.length ? (
                    <List>
                      {salesRequests.map((item) => {
                        const typeLabel = formatPropertyTypeLabel(item.property_type, t);
                        const dealLabel = formatDealTypeLabel(item.deal_type, t);
                        const createdAt = formatDate(item.created_at, locale);
                        return (
                          <ListItem
                            key={String(item.id)}
                            role="button"
                            tabIndex={0}
                            onClick={() => setActiveSale(item)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setActiveSale(item);
                              }
                            }}
                            aria-label={`${t("account.view")} ${t("account.saleRequest")}`}
                          >
                            <TitleRow>
                              <TitleGroup>
                            <strong>{String(item.title ?? t("account.saleRequest"))}</strong>
                                {dealLabel ? <DealPill>{dealLabel}</DealPill> : null}
                              </TitleGroup>
                              <StatusRow>
                                <StatusBadge>
                                  <BadgeCheck size={12} />
                                  Under review
                                </StatusBadge>
                                <span>{createdAt || t("account.requestedTbd")}</span>
                              </StatusRow>
                            </TitleRow>
                            <IconLabel>
                              <MapPin />
                              {[item.township, item.district, item.state_region]
                                .filter(Boolean)
                                .join(", ") || t("account.locationTbd")}
                            </IconLabel>
                            <CardDivider />
                            <DetailRow>
                              <IconLabel>
                                <Calendar />
                                {createdAt || t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <TagIcon />
                                {formatCurrency(item.price as number, item.currency as string) || t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <Home />
                                {[typeLabel].filter(Boolean).join(" ") || t("account.requestedTbd")}
                              </IconLabel>
                            </DetailRow>
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Muted>{t("account.noSales")}</Muted>
                  )}
                  <FloatingAction type="button" onClick={() => router.push("/request-sale")}>
                    {t("account.newSale")}
                  </FloatingAction>
                </>
              )}
            {/* </PageSection> */}
          </>
        )}
      </PageShell>
      {activeInquiry && (
        <ModalOverlay onClick={closeDetails}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <ModalHeader>
              <div>
                <strong>
                  {formatInquiryDealLabel(activeInquiry.deal_type, t)}{" "}
                  {formatPropertyTypeLabel(activeInquiry.property_type, t)}
                </strong>
              <Muted>
                {formatDate(activeInquiry.created_at, locale) || t("account.submittedTbd")}
              </Muted>
              </div>
              <GhostButton type="button" onClick={closeDetails} aria-label={t("account.close")}>
                <X size={16} />
              </GhostButton>
            </ModalHeader>
            <IconLabel>
              <MapPin />
              {[activeInquiry.township, activeInquiry.district, activeInquiry.state_region]
                .filter(Boolean)
                .join(", ") || t("account.locationTbd")}
            </IconLabel>
            <CardDivider />
            <DetailRow>
              <IconLabel>
                <TagIcon />
                {formatBudgetLabel(activeInquiry.budget_range, activeInquiry.deal_type, t) ||
                  t("account.budgetTbd")}
              </IconLabel>
              <IconLabel>
                <Clock />
                {formatTimelineLabel(activeInquiry.timeline, t) || t("account.timelineTbd")}
              </IconLabel>
            </DetailRow>
            {(() => {
              const needs = [];
              if (activeInquiry.need_parking) needs.push(t("account.needParking"));
              if (activeInquiry.need_lift) needs.push(t("account.needLift"));
              if (activeInquiry.need_solar) needs.push(t("account.needSolar"));
              if (activeInquiry.need_generator) needs.push(t("account.needGenerator"));
              return needs.length ? (
                <TagRow>
                  {needs.map((need) => (
                    <Tag key={need}>{need}</Tag>
                  ))}
                </TagRow>
              ) : (
                <Muted>{t("account.noSpecial")}</Muted>
              );
            })()}
            <ModalActions>
              <GhostButton type="button" onClick={closeDetails}>
                {t("account.close")}
              </GhostButton>
              <CTAButton
                type="button"
                onClick={() => {
                  closeDetails();
                  router.push(`/inquiries/new?editId=${String(activeInquiry.id ?? "")}`);
                }}
              >
                {t("account.editInquiry")}
              </CTAButton>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
      {activeSale && (
        <ModalOverlay onClick={closeDetails}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <ModalHeader>
              <div>
                <strong>{String(activeSale.title ?? t("account.saleRequest"))}</strong>
              <Muted>
                {formatDate(activeSale.created_at, locale) || t("account.submittedTbd")}
              </Muted>
              </div>
              <GhostButton type="button" onClick={closeDetails} aria-label={t("account.close")}>
                <X size={16} />
              </GhostButton>
            </ModalHeader>
            <IconLabel>
              <MapPin />
              {[activeSale.township, activeSale.district, activeSale.state_region]
                .filter(Boolean)
                .join(", ") || t("account.locationTbd")}
            </IconLabel>
            <CardDivider />
            <DetailRow>
              <IconLabel>
                <TagIcon />
                {formatCurrency(activeSale.price as number, activeSale.currency as string) || t("account.priceTbd")}
              </IconLabel>
              <IconLabel>
                <Home />
                {[formatDealTypeLabel(activeSale.deal_type, t), formatPropertyTypeLabel(activeSale.property_type, t)]
                  .filter(Boolean)
                  .join(" ") || t("account.typeTbd")}
              </IconLabel>
              <IconLabel>
                <BedDouble />
                {typeof activeSale.bedrooms === "number"
                  ? activeSale.bedrooms
                  : t("account.requestedTbd")}
              </IconLabel>
              <IconLabel>
                <Bath />
                {typeof activeSale.bathrooms === "number"
                  ? activeSale.bathrooms
                  : t("account.requestedTbd")}
              </IconLabel>
              <IconLabel>
                <Ruler />
                {formatArea(activeSale.area_sqft, locale, t("listing.areaSqft")) ||
                  t("account.requestedTbd")}
              </IconLabel>
            </DetailRow>
            {activeSale.address_text ? (
              <Muted>{String(activeSale.address_text)}</Muted>
            ) : activeSale.city ? (
              <Muted>{String(activeSale.city)}</Muted>
            ) : null}
            {activeSale.description ? <Muted>{String(activeSale.description)}</Muted> : null}
            <InlineNotice>
              This property request is under review. It will only appear as a live listing after the platform review is completed.
            </InlineNotice>
            <ModalActions>
              <GhostButton type="button" onClick={closeDetails}>
                {t("account.close")}
              </GhostButton>
              <CTAButton
                type="button"
                onClick={() => {
                  closeDetails();
                  router.push(`/request-sale?editId=${String(activeSale.id ?? "")}`);
                }}
              >
                {t("account.editListing")}
              </CTAButton>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </div>
  );
}

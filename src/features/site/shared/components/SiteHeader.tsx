"use client";

import Link from "next/link";
import styled from "styled-components";
import { MoonStar, Settings, SunMedium } from "lucide-react";
import { useAppState } from "@/features/site/shared/lib/app-state";
import { useLanguage, useThemeMode } from "@/features/site/shared/components/Providers";
import { useI18n } from "@/features/site/shared/lib/i18n";
import { useState } from "react";
import { CustomSelect } from "@/features/site/shared/components/form-controls/CustomSelect";

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

const IconButton = styled.button`
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
  padding: 0;

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

const IconLink = styled(Link)`
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
  text-decoration: none;

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

const LanguageOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(12, 18, 36, 0.45);
  display: grid;
  place-items: center;
  z-index: 90;
  padding: 16px;
`;

const LanguageCard = styled.div`
  width: min(360px, 92vw);
  background: var(--color-surface);
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--shadow-soft);
  display: grid;
  gap: 12px;
`;

const LanguageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LanguageTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const ActionButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  background: var(--color-surface-2);
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
`;

const PrimaryButton = styled(ActionButton)`
  background: var(--gradient);
  color: #fff;
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: var(--frame-shadow);
`;

export function SiteHeader() {
  const { user } = useAppState();
  const { mode, toggle } = useThemeMode();
  const { t } = useI18n();
  const { language, setLanguage } = useLanguage();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language);

  const languageOptions = [
    { value: "mm", label: "Myanmar" },
    { value: "en", label: "English" },
    { value: "zh", label: "中文" },
    { value: "th", label: "ไทย" },
  ];

  const languageFlag = (value: string) => {
    if (value === "mm") return "🇲🇲";
    if (value === "zh") return "🇨🇳";
    if (value === "th") return "🇹🇭";
    return "🇬🇧";
  };

  return (
    <Header>
      <HeaderInner>
        <Brand>
          <BrandMark>
            <img src="/KTLogo.png" alt="Eain Chan Myay logo" />
          </BrandMark>
          <BrandText>
            <Link href="/">Eain Chan Myay</Link>
            <BrandSub>{t("site.tagline")}</BrandSub>
          </BrandText>
        </Brand>
        <Actions>
          <IconButton
            type="button"
            onClick={() => {
              setSelectedLanguage(language);
              setLanguageOpen(true);
            }}
            aria-label={t("settings.language")}
          >
            {languageFlag(language)}
          </IconButton>
          <IconButton type="button" onClick={toggle} aria-label={t("nav.toggleTheme")}>
            {mode === "dark" ? <SunMedium strokeWidth={1.6} /> : <MoonStar strokeWidth={1.6} />}
          </IconButton>
          <IconLink href={user ? "/settings" : "/auth"} aria-label={t("nav.settings")}>
            <Settings strokeWidth={1.6} />
          </IconLink>
        </Actions>
      </HeaderInner>
      {languageOpen && (
        <LanguageOverlay onClick={() => setLanguageOpen(false)}>
          <LanguageCard onClick={(event) => event.stopPropagation()}>
            <LanguageHeader>
              <LanguageTitle>{t("settings.language")}</LanguageTitle>
              <ActionButton type="button" onClick={() => setLanguageOpen(false)}>
                {t("common.close")}
              </ActionButton>
            </LanguageHeader>
            <CustomSelect
              id="language-picker"
              name="language"
              label={t("settings.language")}
              value={selectedLanguage}
              onChange={(value) => setSelectedLanguage(value as "mm" | "en" | "zh" | "th")}
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </CustomSelect>
            <ButtonRow>
              <PrimaryButton
                type="button"
                onClick={() => {
                  setLanguage(selectedLanguage as "mm" | "en" | "zh" | "th");
                  setLanguageOpen(false);
                }}
              >
                {t("common.saveChanges")}
              </PrimaryButton>
            </ButtonRow>
          </LanguageCard>
        </LanguageOverlay>
      )}
    </Header>
  );
}

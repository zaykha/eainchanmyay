"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";
import styled from "styled-components";
import { useLanguage } from "@/features/site/shared/components/Providers";
import { useAppState } from "@/features/site/shared/lib/app-state";
import { resolveHeaderAccountPresentation } from "@/features/site/shared/lib/header-account";
import { useI18n } from "@/features/site/shared/lib/i18n";
import {
  deriveActiveContextFromPath,
  readActiveContext,
  readActiveVendorWorkspace,
  writeActiveContext,
  writeActiveVendorWorkspace,
} from "@/features/site/vendor/lib/active-context";

const Header = styled.header`
  padding: 14px 20px 0;

  @media (max-width: 720px) {
    padding: 0;
  }
`;

const HeaderInner = styled.div`
  max-width: 1280px;
  margin: 0 auto;
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

const WorkspaceMenu = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;

  &:hover > div,
  &:focus-within > div {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
`;

const WorkspaceMenuTrigger = styled.button`
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 0;

  svg {
    width: 14px;
    height: 14px;
    color: var(--color-muted);
  }
`;

const WorkspaceMenuDropdown = styled.div`
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  min-width: 220px;
  padding: 10px;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.14);
  display: grid;
  gap: 6px;
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  transition: opacity 140ms ease, transform 140ms ease;
  z-index: 20;
`;

const WorkspaceMenuSection = styled.div`
  display: grid;
  gap: 6px;
  padding-top: 4px;
`;

const WorkspaceMenuLabel = styled.div`
  padding: 4px 10px 0;
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const WorkspaceMenuItem = styled(Link)<{ $active?: boolean }>`
  min-height: 42px;
  padding: 10px 12px;
  border-radius: 12px;
  display: grid;
  gap: 2px;
  background: ${(props) => (props.$active ? "color-mix(in srgb, var(--color-primary) 8%, white)" : "transparent")};
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-text)")};

  strong {
    font-size: 0.92rem;
    line-height: 1.2;
  }

  span {
    font-size: 0.78rem;
    color: var(--color-muted);
  }
`;

const WorkspaceMenuButton = styled.button<{ $active?: boolean }>`
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  border-radius: 12px;
  border: none;
  display: grid;
  gap: 2px;
  text-align: left;
  cursor: pointer;
  background: ${(props) => (props.$active ? "color-mix(in srgb, var(--color-primary) 8%, white)" : "transparent")};
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-text)")};

  strong {
    font-size: 0.92rem;
    line-height: 1.2;
  }

  span {
    font-size: 0.78rem;
    color: var(--color-muted);
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

const MobileMenuOverlay = styled.div<{ $open?: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 22, 0.5);
  z-index: 115;
  display: none;

  @media (max-width: 720px) {
    display: grid;
    align-items: start;
    opacity: ${(props) => (props.$open ? 1 : 0)};
    pointer-events: ${(props) => (props.$open ? "auto" : "none")};
    transition: opacity 180ms ease;
  }
`;

const MobileMenuDrawer = styled.div<{ $open?: boolean }>`
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
  transform-origin: top center;
  transform: ${(props) => (props.$open ? "translateY(0) scaleY(1)" : "translateY(-12px) scaleY(0.94)")};
  opacity: ${(props) => (props.$open ? 1 : 0)};
  transition:
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 180ms ease;
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

const GhostButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 999px;
  padding: 8px 12px;
  background: #fff;
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
`;

const LanguageOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 22, 0.5);
  z-index: 115;
  display: grid;
  place-items: center;
  padding: 16px;
`;

const LanguageModal = styled.div`
  width: min(520px, 92vw);
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  box-shadow: 0 26px 50px rgba(15, 23, 42, 0.18);
  padding: 20px;
  display: grid;
  gap: 16px;
`;

const LanguageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
`;

const LanguageTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const LanguageCopy = styled.p`
  margin: 4px 0 0;
  color: var(--color-muted);
`;

const LanguageGrid = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
`;

type MarketplaceHeaderProps = {
  accountLabelOverride?: string | null;
  accountHrefOverride?: string | null;
};

type WorkspaceOption = {
  vendor: {
    id: string;
    name: string;
    slug?: string | null;
    logo_url?: string | null;
  };
  membership: {
    role: string;
    status?: string;
  };
};

function formatRoleLabel(role: string | null | undefined, t: (key: string) => string) {
  const normalized = String(role ?? "").trim().toLowerCase();
  if (normalized === "owner") return t("role.owner");
  if (normalized === "admin") return t("role.admin");
  if (normalized === "agent" || normalized === "staff") return t("role.staff");
  return t("role.member");
}

export function MarketplaceHeader({
  accountLabelOverride,
  accountHrefOverride,
}: MarketplaceHeaderProps) {
  const router = useRouter();
  const { user, authToken, profileRole, profileReady, loading } = useAppState();
  const pathname = usePathname();
  const { t } = useI18n();
  const { language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [activeContext, setActiveContext] = useState<"personal" | "vendor">("personal");
  const [workspaceOptions, setWorkspaceOptions] = useState<WorkspaceOption[]>([]);
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  const hasWorkspaceAccess = profileReady && profileRole === "vendor_user";
  const navLinks = [
    { label: t("header.articles"), href: "/articles" },
    { label: t("header.ourPartners"), href: "/partners" },
  ];

  useEffect(() => {
    const pathContext = deriveActiveContextFromPath(pathname);
    if (pathContext) {
      setActiveContext(pathContext);
      writeActiveContext(pathContext);
      return;
    }
    const cached = readActiveContext();
    if (cached === "vendor" && hasWorkspaceAccess) {
      setActiveContext("vendor");
      return;
    }
    setActiveContext("personal");
  }, [hasWorkspaceAccess, pathname]);

  useEffect(() => {
    if (!user?.id) {
      setActiveVendorId(null);
      return;
    }
    setActiveVendorId(readActiveVendorWorkspace(user.id));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !hasWorkspaceAccess) {
      setWorkspaceOptions([]);
      return;
    }

    let active = true;

    fetch("/api/vendor/workspace?includeUsage=false", {
      headers: authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : undefined,
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | {
              vendor?: { id?: string };
              workspaces?: WorkspaceOption[];
            }
          | null;
        if (!response.ok || !active) return;
        const nextWorkspaces = Array.isArray(payload?.workspaces) ? payload.workspaces : [];
        setWorkspaceOptions(nextWorkspaces);
        const storedVendorId = readActiveVendorWorkspace(user.id);
        if (storedVendorId) {
          setActiveVendorId(storedVendorId);
          return;
        }
        const fallbackVendorId = payload?.vendor?.id ? String(payload.vendor.id) : nextWorkspaces[0]?.vendor.id ?? null;
        if (fallbackVendorId) {
          writeActiveVendorWorkspace(user.id, fallbackVendorId);
          setActiveVendorId(fallbackVendorId);
        }
      })
      .catch(() => {
        if (active) {
          setWorkspaceOptions([]);
        }
      });

    return () => {
      active = false;
    };
  }, [authToken, hasWorkspaceAccess, user?.id]);

  const resolvedAccount = useMemo(
    () =>
      resolveHeaderAccountPresentation({
        user,
        profileRole,
        profileReady,
        loading,
      }),
    [loading, profileReady, profileRole, user]
  );

  const accountLabel =
    accountLabelOverride ||
    (!user ? t("header.signInRegister") : hasWorkspaceAccess && activeContext === "vendor" ? t("header.hub") : t("header.account"));
  const accountHref =
    accountHrefOverride || (!user ? resolvedAccount.href : hasWorkspaceAccess && activeContext === "vendor" ? "/hub" : "/account");
  const currentWorkspace =
    workspaceOptions.find((workspace) => workspace.vendor.id === (activeVendorId ?? "")) ?? workspaceOptions[0] ?? null;

  const languageOptions = [
    { value: "en", flag: "🇬🇧", name: "English" },
    { value: "mm", flag: "🇲🇲", name: "Myanmar" },
    { value: "zh", flag: "🇨🇳", name: "Chinese" },
    { value: "th", flag: "🇹🇭", name: "Thai" },
  ] as const;
  const languageFlag = language === "mm" ? "🇲🇲" : language === "zh" ? "🇨🇳" : language === "th" ? "🇹🇭" : "🇬🇧";

  const handleWorkspaceSwitch = (workspace: WorkspaceOption) => {
    if (!user?.id) return;
    writeActiveVendorWorkspace(user.id, workspace.vendor.id);
    writeActiveContext("vendor");
    setActiveContext("vendor");
    setActiveVendorId(workspace.vendor.id);
    setMobileMenuOpen(false);
    const workspaceRole = String(workspace.membership.role ?? "").trim().toLowerCase();
    router.push(workspaceRole === "owner" || workspaceRole === "admin" ? "/hub" : "/hub?section=manage-listings");
  };

  return (
    <>
      <Header>
        <HeaderInner>
          <MobileMenuButton type="button" aria-label={t("header.openNavigationMenu")} onClick={() => setMobileMenuOpen(true)}>
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
            {user && hasWorkspaceAccess ? (
              <WorkspaceMenu>
                <WorkspaceMenuTrigger type="button" aria-label={t("header.openWorkspaceSwitcher")}>
                  <span>{t("header.hub")}</span>
                  <ChevronDown />
                </WorkspaceMenuTrigger>
                <WorkspaceMenuDropdown>
                  <WorkspaceMenuItem
                    href="/account"
                    $active={activeContext === "personal"}
                    onClick={() => {
                      writeActiveContext("personal");
                      setActiveContext("personal");
                    }}
                  >
                    <strong>{t("header.personalAccount")}</strong>
                    <span>{t("header.personalAccountHint")}</span>
                  </WorkspaceMenuItem>
                  <WorkspaceMenuItem
                    href="/hub"
                    $active={activeContext === "vendor"}
                    onClick={() => {
                      writeActiveContext("vendor");
                      setActiveContext("vendor");
                    }}
                  >
                    <strong>{t("header.agencyWorkspace")}</strong>
                    <span>
                      {currentWorkspace
                        ? `${currentWorkspace.vendor.name} · ${formatRoleLabel(currentWorkspace.membership.role, t)}`
                        : t("header.agencyWorkspaceHint")}
                    </span>
                  </WorkspaceMenuItem>
                  {workspaceOptions.length > 0 ? (
                    <WorkspaceMenuSection>
                      <WorkspaceMenuLabel>{t("header.switchAgency")}</WorkspaceMenuLabel>
                      {workspaceOptions.map((workspace) => (
                        <WorkspaceMenuButton
                          key={workspace.vendor.id}
                          type="button"
                          $active={(activeVendorId ?? currentWorkspace?.vendor.id ?? "") === workspace.vendor.id}
                          onClick={() => handleWorkspaceSwitch(workspace)}
                        >
                          <strong>{workspace.vendor.name}</strong>
                          <span>{formatRoleLabel(workspace.membership.role, t)}</span>
                        </WorkspaceMenuButton>
                      ))}
                    </WorkspaceMenuSection>
                  ) : null}
                </WorkspaceMenuDropdown>
              </WorkspaceMenu>
            ) : (
              <Link href={accountHref}>{accountLabel}</Link>
            )}
          </HeaderLinks>
          <HeaderActions>
            <LanguageTrigger
              type="button"
              aria-label={t("header.openLanguageSelector")}
              onClick={() => setLanguageOpen(true)}
            >
              {languageFlag}
            </LanguageTrigger>
          </HeaderActions>
        </HeaderInner>
      </Header>

      <MobileMenuOverlay $open={mobileMenuOpen} onClick={() => setMobileMenuOpen(false)}>
        <MobileMenuDrawer $open={mobileMenuOpen} onClick={(event) => event.stopPropagation()}>
            <MobileMenuHeader>
              <MobileMenuTitle>{t("header.menu")}</MobileMenuTitle>
              <GhostButton type="button" onClick={() => setMobileMenuOpen(false)}>
                {t("header.close")}
              </GhostButton>
            </MobileMenuHeader>
            <MobileMenuLinks>
              {user && hasWorkspaceAccess ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => {
                      writeActiveContext("personal");
                      setActiveContext("personal");
                      setMobileMenuOpen(false);
                    }}
                  >
                    {t("header.personalAccount")}
                  </Link>
                  <Link
                    href="/hub"
                    onClick={() => {
                      writeActiveContext("vendor");
                      setActiveContext("vendor");
                      setMobileMenuOpen(false);
                    }}
                  >
                    {t("header.agencyWorkspace")}
                  </Link>
                  {workspaceOptions.length > 0
                    ? workspaceOptions.map((workspace) => (
                        <Link
                          key={workspace.vendor.id}
                          href={String(workspace.membership.role ?? "").trim().toLowerCase() === "owner" ||
                          String(workspace.membership.role ?? "").trim().toLowerCase() === "admin"
                            ? "/hub"
                            : "/hub?section=manage-listings"}
                          onClick={(event) => {
                            event.preventDefault();
                            handleWorkspaceSwitch(workspace);
                          }}
                        >
                          {workspace.vendor.name} · {formatRoleLabel(workspace.membership.role, t)}
                        </Link>
                      ))
                    : null}
                </>
              ) : null}
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

      {languageOpen ? (
        <LanguageOverlay onClick={() => setLanguageOpen(false)}>
          <LanguageModal onClick={(event) => event.stopPropagation()}>
            <LanguageHeader>
              <div>
                <LanguageTitle>{t("settings.language")}</LanguageTitle>
                <LanguageCopy>{t("header.languagePrompt")}</LanguageCopy>
              </div>
              <GhostButton type="button" onClick={() => setLanguageOpen(false)}>
                {t("header.close")}
              </GhostButton>
            </LanguageHeader>
            <LanguageGrid>
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
            </LanguageGrid>
          </LanguageModal>
        </LanguageOverlay>
      ) : null}
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  FileSpreadsheet,
  LayoutDashboard,
  Menu,
  MessagesSquare,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Users2,
  X,
} from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";
import { readActiveVendorWorkspace, withActiveVendorHeaders } from "@/app/living-site/lib/active-context";
import { readWorkspaceCache, writeWorkspaceCache } from "@/app/living-site/lib/vendor-workspace-cache";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";
import { isVendorStorefrontSetupComplete } from "@/lib/vendor-storefront";

const Frame = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 248px 1fr;
  background: #0b0f18;
  color: #eef2ff;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.aside<{ $open?: boolean }>`
  background: #141a28;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  padding: 24px 18px;
  display: grid;
  align-content: start;
  gap: 18px;

  @media (max-width: 960px) {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(84vw, 300px);
    z-index: 120;
    transform: translateX(${(props) => (props.$open ? "0" : "-100%")});
    transition: transform 180ms ease;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.36);
  }
`;

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #f8fafc;
  font-weight: 700;
  font-size: 1.05rem;
`;

const BrandMark = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: grid;
  place-items: center;

  img {
    width: 24px;
    height: 24px;
  }
`;

const Nav = styled.nav`
  display: grid;
  gap: 8px;
`;

const NavLink = styled(Link)<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  color: ${(props) => (props.$active ? "#ffffff" : "#c7cfdd")};
  background: ${(props) => (props.$active ? "rgba(255,255,255,0.06)" : "transparent")};
  border: 1px solid ${(props) => (props.$active ? "rgba(255,255,255,0.08)" : "transparent")};
  font-weight: 600;
`;

const SidebarHint = styled.p`
  margin: 8px 0 0;
  color: #8e98aa;
  font-size: 0.88rem;
  line-height: 1.55;
`;

const Content = styled.main`
  min-width: 0;
  padding: 24px;
  display: grid;
  gap: 20px;

  @media (max-width: 960px) {
    padding: 18px 14px 28px;
  }
`;

const MobileBar = styled.div`
  display: none;

  @media (max-width: 960px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0 4px;
  }
`;

const MobileBrand = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  color: #f8fafc;
`;

const IconButton = styled.button`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  color: #eef2ff;
  display: inline-grid;
  place-items: center;
  cursor: pointer;
`;

const Overlay = styled.button<{ $open?: boolean }>`
  display: none;

  @media (max-width: 960px) {
    display: ${(props) => (props.$open ? "block" : "none")};
    position: fixed;
    inset: 0;
    z-index: 110;
    border: none;
    background: rgba(4, 7, 12, 0.56);
  }
`;

const AccessCard = styled.div`
  max-width: 680px;
  margin: 60px auto;
  padding: 24px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #141a28;
  display: grid;
  gap: 14px;
`;

const AccessTitle = styled.h1`
  margin: 0;
  font-size: 1.7rem;
`;

const AccessText = styled.p`
  margin: 0;
  color: #9ba3b5;
  line-height: 1.6;
`;

const AccessActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const PrimaryAction = styled.button`
  min-height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #ff3d5d 0%, #e91b42 100%);
  color: white;
  font-weight: 700;
  cursor: pointer;
`;

const SecondaryAction = styled.button`
  min-height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: #eef2ff;
  font-weight: 700;
  cursor: pointer;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(4, 7, 12, 0.56);
  display: grid;
  place-items: center;
  padding: 16px;
`;

const ModalCard = styled.div`
  width: min(720px, 100%);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #141a28;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
  padding: 22px;
  display: grid;
  gap: 14px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.35rem;
`;

const ModalText = styled.p`
  margin: 0;
  color: #9ba3b5;
  line-height: 1.65;
`;

const navItems = [
  { href: "/vendor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/properties", label: "Properties", icon: Building2 },
  { href: "/vendor/viewing-requests", label: "Viewing Requests", icon: CalendarDays },
  { href: "/vendor/sales-requests", label: "Sales Requests", icon: ClipboardList },
  { href: "/vendor/inquiries", label: "Inquiries", icon: MessagesSquare },
  { href: "/vendor/team", label: "Team", icon: Users2 },
  { href: "/vendor/import", label: "Bulk Import", icon: FileSpreadsheet },
  { href: "/vendor/verification", label: "Verification", icon: ShieldCheck },
  { href: "/request-sale", label: "Request Listing", icon: Plus },
  { href: "/vendor/settings", label: "Settings", icon: Settings },
];

type WorkspaceSummary = {
  vendor: {
    id: string;
    name: string;
    vendor_type: string;
    plan: string | null;
    billing_status: string | null;
    billing_provider: string | null;
  };
  membership: {
    role: string;
  };
};

export function VendorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profileRole, profileReady, authToken } = useAppState();
  const [menuOpen, setMenuOpen] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [showHubAgencySetupPopup, setShowHubAgencySetupPopup] = useState(false);

  useEffect(() => {
    if (!profileReady || !authToken || !user) return;

    let cancelled = false;

    const activeVendorId = readActiveVendorWorkspace(user.id);
    const cachedWorkspace = readWorkspaceCache<WorkspaceSummary>(user.id, "summary", activeVendorId);
    if (cachedWorkspace) {
      setWorkspace(cachedWorkspace);
      setWorkspaceLoading(false);
      setWorkspaceError(null);
    }

    const fetchWorkspace = async () => {
      if (!cachedWorkspace) {
        setWorkspaceLoading(true);
      }
      setWorkspaceError(null);

      const runWorkspaceFetch = async () => {
        const response = await fetch("/api/vendor/workspace?includeUsage=false", {
          headers: withActiveVendorHeaders(
            {
              Authorization: `Bearer ${authToken}`,
            },
            activeVendorId
          ),
        });
        const payload = (await response.json().catch(() => null)) as WorkspaceSummary & { error?: string } | null;
        return { response, payload };
      };

      try {
        const { response, payload } = await runWorkspaceFetch();

        if (!response.ok && payload?.error === "Vendor membership not found.") {
          router.replace("/vendor-setup");
          return;
        }

        if (!response.ok || !payload?.vendor) {
          throw new Error(payload?.error ?? "Unable to load the vendor workspace.");
        }

        const hubRoute = pathname === "/hub" || pathname.startsWith("/hub/");
        const storefrontComplete = isVendorStorefrontSetupComplete(payload.vendor);

        if (!storefrontComplete) {
          if (hubRoute) {
            // On /hub: do not hard-redirect; show a popup to guide the user.
            if (typeof window !== "undefined") setShowHubAgencySetupPopup(true);
          } else {
            router.replace("/agency-setup");
            return;
          }
        } else {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("kaiten_skip_agency_setup_on_hub");
            window.localStorage.removeItem("kaiten_skip_agency_setup_on_hub_once");
          }
        }

        if (payload.vendor.plan === "free") {
          router.replace("/hub");
          return;
        }

        const requiresActiveBilling = payload.vendor.plan && payload.vendor.plan !== "free";
        if (requiresActiveBilling && payload.vendor.billing_status !== "active") {
          router.replace("/vendor-setup");
          return;
        }

        if (!cancelled) {
          setWorkspace(payload);
          writeWorkspaceCache(user.id, "summary", payload, payload.vendor?.id);
        }
      } catch (error) {
        if (!cancelled) {
          if (!cachedWorkspace) {
            setWorkspace(null);
          }
          setWorkspaceError(
            error instanceof Error ? error.message : "Unable to load the vendor workspace."
          );
        }
      } finally {
        if (!cancelled) {
          setWorkspaceLoading(false);
        }
      }
    };

    void fetchWorkspace();

    return () => {
      cancelled = true;
    };
  }, [authToken, profileReady, router, user, pathname]);

  if (!profileReady) {
    return <LoadingOverlay message="Loading vendor workspace..." />;
  }

  if (!user) {
    return (
      <Frame>
        <Content>
          <AccessCard>
            <AccessTitle>Sign in to access the vendor workspace</AccessTitle>
            <AccessText>
              This area is reserved for vendor accounts managing listings, requests, and workspace operations.
            </AccessText>
            <AccessActions>
              <PrimaryAction type="button" onClick={() => router.push("/auth")}>
                Go to login
              </PrimaryAction>
              <SecondaryAction type="button" onClick={() => router.push("/")}>
                Back to home
              </SecondaryAction>
            </AccessActions>
          </AccessCard>
        </Content>
      </Frame>
    );
  }

  if (!workspaceLoading && !workspace && profileRole !== "vendor_user") {
    return (
      <Frame>
        <Content>
          <AccessCard>
            <AccessTitle>Vendor access required</AccessTitle>
            <AccessText>
              Your current account does not have vendor workspace access. Sign in with a vendor account or return to the public site.
            </AccessText>
            <AccessActions>
              <PrimaryAction type="button" onClick={() => router.push("/auth")}>
                Switch account
              </PrimaryAction>
              <SecondaryAction type="button" onClick={() => router.push("/")}>
                Back to home
              </SecondaryAction>
            </AccessActions>
          </AccessCard>
        </Content>
      </Frame>
    );
  }

  if (workspaceLoading) {
    return <LoadingOverlay message="Preparing workspace..." />;
  }

  if (workspaceError) {
    return (
      <Frame>
        <Content>
          <AccessCard>
            <AccessTitle>Workspace unavailable</AccessTitle>
            <AccessText>{workspaceError}</AccessText>
            <AccessActions>
              <PrimaryAction type="button" onClick={() => window.location.reload()}>
                Retry
              </PrimaryAction>
              <SecondaryAction type="button" onClick={() => router.push("/")}>
                Back to home
              </SecondaryAction>
            </AccessActions>
          </AccessCard>
        </Content>
      </Frame>
    );
  }

  return (
    <Frame>
      <Overlay type="button" aria-label="Close menu" $open={menuOpen} onClick={() => setMenuOpen(false)} />
      <Sidebar $open={menuOpen}>
        <Brand href="/vendor" onClick={() => setMenuOpen(false)}>
          <BrandMark>
            <img src="/KTLogo.png" alt="Eain Chan Myay" />
          </BrandMark>
          <span>{workspace?.vendor.name || "Vendor Workspace"}</span>
        </Brand>
        <Nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/vendor" && pathname.startsWith(item.href));
            return (
              <NavLink key={item.href} href={item.href} $active={active} onClick={() => setMenuOpen(false)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </Nav>
        <SidebarHint>
          Phase 1 includes the vendor shell, dashboard, and property workspace. Team, inquiries, and request management come next.
        </SidebarHint>
      </Sidebar>

      <Content>
        <MobileBar>
          <IconButton type="button" aria-label="Open menu" onClick={() => setMenuOpen((prev) => !prev)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </IconButton>
          <MobileBrand>
            <BrandMark>
              <img src="/KTLogo.png" alt="Eain Chan Myay" />
            </BrandMark>
            <span>{workspace?.vendor.name || "Vendor"}</span>
          </MobileBrand>
          <div style={{ width: 42 }} />
        </MobileBar>

        {children}

        {showHubAgencySetupPopup ? (
          <ModalOverlay
            role="dialog"
            aria-modal="true"
            onClick={() => setShowHubAgencySetupPopup(false)}
          >
            <ModalCard onClick={(e) => e.stopPropagation()}>
              <ModalTitle>Set up your agency profile</ModalTitle>
              <ModalText>
                To show your agency properly in the Hub, finish your public storefront (name, contact, logo, and bio).
                You can set it up now, or continue to view the Hub with the current agencies.
              </ModalText>
              <AccessActions>
                <SecondaryAction
                  type="button"
                  onClick={() => {
                    setShowHubAgencySetupPopup(false);
                    // keep existing bypass flags for other flows; this is just a dismiss
                    if (typeof window !== "undefined") {
                      window.localStorage.setItem("kaiten_skip_agency_setup_on_hub_once", "1");
                    }
                  }}
                >
                  Continue to Hub
                </SecondaryAction>
                <PrimaryAction
                  type="button"
                  onClick={() => {
                    setShowHubAgencySetupPopup(false);
                    router.replace("/agency-setup");
                  }}
                >
                  <Sparkles size={18} />
                  Set up agency
                </PrimaryAction>
              </AccessActions>
            </ModalCard>
          </ModalOverlay>
        ) : null}
      </Content>
    </Frame>
  );
}

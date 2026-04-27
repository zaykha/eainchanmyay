"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { Building2, CalendarDays, ClipboardList, LayoutDashboard, Menu, MessagesSquare, Plus, Settings, Users2, X } from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";

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

const navItems = [
  { href: "/vendor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/properties", label: "Properties", icon: Building2 },
  { href: "/vendor/viewing-requests", label: "Viewing Requests", icon: CalendarDays },
  { href: "/vendor/sales-requests", label: "Sales Requests", icon: ClipboardList },
  { href: "/vendor/inquiries", label: "Inquiries", icon: MessagesSquare },
  { href: "/vendor/team", label: "Team", icon: Users2 },
  { href: "/request-sale", label: "Request Listing", icon: Plus },
  { href: "/vendor/settings", label: "Settings", icon: Settings },
];

type WorkspaceSummary = {
  vendor: {
    id: string;
    name: string;
    vendor_type: string;
    plan: string | null;
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

  useEffect(() => {
    if (!profileReady || !authToken || profileRole !== "vendor_user") return;

    let cancelled = false;

    const fetchWorkspace = async () => {
      setWorkspaceLoading(true);
      setWorkspaceError(null);

      const runWorkspaceFetch = async () => {
        const response = await fetch("/api/vendor/workspace", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const payload = (await response.json().catch(() => null)) as WorkspaceSummary & { error?: string } | null;
        return { response, payload };
      };

      try {
        let { response, payload } = await runWorkspaceFetch();

        if (!response.ok && payload?.error === "Vendor membership not found.") {
          const bootstrapResponse = await fetch("/api/vendors/bootstrap", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ vendorType: "solo_agent" }),
          });

          if (!bootstrapResponse.ok) {
            const bootstrapPayload = (await bootstrapResponse.json().catch(() => null)) as { message?: string } | null;
            throw new Error(bootstrapPayload?.message ?? "Unable to set up the vendor workspace.");
          }

          ({ response, payload } = await runWorkspaceFetch());
        }

        if (!response.ok || !payload?.vendor) {
          throw new Error(payload?.error ?? "Unable to load the vendor workspace.");
        }

        if (!cancelled) {
          setWorkspace(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setWorkspaceError(error instanceof Error ? error.message : "Unable to load the vendor workspace.");
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
  }, [authToken, profileReady, profileRole]);

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

  if (profileRole !== "vendor_user") {
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
      </Content>
    </Frame>
  );
}

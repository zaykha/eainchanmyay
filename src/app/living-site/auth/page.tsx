"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { ArrowLeft } from "lucide-react";
import { isSupabaseConfigured } from "@/app/living-site/lib/supabaseClient";
import { useAppState } from "@/app/living-site/lib/app-state";
import { AuthScreen, type AuthRole } from "@/app/living-site/components/AuthScreen";
import { useRouter } from "next/navigation";
import { useI18n } from "@/app/living-site/lib/i18n";
import type { ProfileRole } from "@/app/living-site/lib/data";

const Page = styled.main<{ $stageLocked?: boolean }>`
  min-height: 100vh;
  padding: 28px 18px;
  background: #fff;

  @media (max-width: 720px) {
    min-height: 100dvh;
    height: ${(props) => (props.$stageLocked ? "100dvh" : "auto")};
    padding: 10px 10px 12px;
    overflow: ${(props) => (props.$stageLocked ? "hidden" : "visible")};
    overscroll-behavior: ${(props) => (props.$stageLocked ? "none" : "auto")};
    position: ${(props) => (props.$stageLocked ? "fixed" : "static")};
    inset: ${(props) => (props.$stageLocked ? "0" : "auto")};
    width: ${(props) => (props.$stageLocked ? "100%" : "auto")};
  }
`;

const Shell = styled.div<{ $stageLocked?: boolean }>`
  width: min(1220px, 100%);
  margin: 0 auto;
  display: grid;
  gap: 20px;

  @media (max-width: 720px) {
    min-height: ${(props) => (props.$stageLocked ? "calc(100dvh - 22px)" : "auto")};
    height: ${(props) => (props.$stageLocked ? "calc(100dvh - 22px)" : "auto")};
    grid-template-rows: auto 1fr;
    gap: 12px;
    overflow: ${(props) => (props.$stageLocked ? "hidden" : "visible")};
  }
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  @media (max-width: 720px) {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    z-index: 5;
    gap: 8px;
    justify-content: flex-start;
  }
`;

const BackButton = styled.button`
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 999px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text);
  cursor: pointer;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 720px) {
    padding: 8px 12px;
    font-size: 0.88rem;
  }
`;

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text);
  font-weight: 700;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StageBrand = styled(Link)`
  display: none;

  @media (max-width: 720px) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--color-text);
    justify-self: center;
  }
`;

const StageBrandMark = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: #fff;
  display: grid;
  place-items: center;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);

  img {
    width: 30px;
    height: 30px;
  }
`;

const StageBrandName = styled.span`
  font-size: 0.98rem;
  font-weight: 800;
`;

const BrandMark = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #fff;
  display: grid;
  place-items: center;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);

  img {
    width: 24px;
    height: 24px;
  }

  @media (max-width: 720px) {
    width: 34px;
    height: 34px;
    border-radius: 10px;

    img {
      width: 20px;
      height: 20px;
    }
  }
`;

const BrandText = styled.div`
  display: grid;
  gap: 2px;
`;

const BrandName = styled.span`
  font-size: 1rem;

  @media (max-width: 720px) {
    font-size: 0.9rem;
  }
`;

const BrandSub = styled.span`
  font-size: 0.8rem;
  color: var(--color-muted);
  font-weight: 500;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StageShell = styled.section`
  display: grid;
  gap: 18px;

  @media (max-width: 720px) {
    min-height: 100dvh;
    height: 100dvh;
    padding: 12px 0;
    place-content: center;
    justify-items: center;
    gap: 12px;
    overflow: hidden;
  }
`;

const StageHeader = styled.div`
  display: grid;
  gap: 8px;
  text-align: center;
  padding-top: 12px;

  @media (max-width: 720px) {
    justify-items: center;
    gap: 4px;
    padding-top: 2px;
  }
`;

const StageTitle = styled.h1`
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 0.95;

  @media (max-width: 720px) {
    font-size: 1.45rem;
    line-height: 1;
  }
`;

const StageSubtitle = styled.p`
  margin: 0 auto;
  max-width: 640px;
  color: var(--color-muted);
  font-size: 1rem;
  line-height: 1.55;

  @media (max-width: 720px) {
    display: none;
  }
`;

const RoleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    width: 100%;
    max-width: 340px;
  }
`;

const RoleCard = styled.button`
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.9);
  padding: 26px;
  display: grid;
  gap: 22px;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 24px 56px rgba(235, 35, 64, 0.14);
    transform: translateY(-2px);
  }

  @media (max-width: 720px) {
    padding: 12px;
    gap: 10px;
    border-radius: 18px;
  }
`;

const RoleVisual = styled.div`
  min-height: 320px;
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 18%, rgba(235, 35, 64, 0.08), transparent 20%),
    radial-gradient(circle at 84% 80%, rgba(235, 35, 64, 0.06), transparent 22%),
    #fff7f7;

  @media (max-width: 720px) {
    min-height: 132px;
    border-radius: 16px;
  }
`;

const VisualLogo = styled.div`
  position: absolute;
  top: 26px;
  left: 28px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  font-weight: 800;

  img {
    width: 34px;
    height: 34px;
  }

  @media (max-width: 720px) {
    display: none;
  }
`;

const RoleIllustration = styled.img`
  position: absolute;
  inset: 84px 22px 22px;
  width: calc(100% - 44px);
  height: calc(100% - 106px);
  object-fit: contain;
  object-position: center;

  @media (max-width: 720px) {
    inset: 38px 10px 8px;
    width: calc(100% - 20px);
    height: calc(100% - 46px);
  }
`;

const RoleBody = styled.div`
  display: grid;
  gap: 10px;

  @media (max-width: 720px) {
    gap: 4px;
    justify-items: center;
    text-align: center;
  }
`;

const RoleTitle = styled.h2`
  margin: 0;
  font-size: 1.75rem;

  @media (max-width: 720px) {
    font-size: 0.98rem;
    line-height: 1.05;
    color: #111827;
  }
`;

const RoleText = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.6;

  @media (max-width: 720px) {
    display: none;
  }
`;

const AuthLayout = styled.section`
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  border-radius: 34px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 26px 70px rgba(15, 23, 42, 0.12);

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const VisualPanel = styled.div`
  position: relative;
  min-height: 760px;
  padding: 34px 34px 260px;
  background:
    radial-gradient(circle at 12% 20%, rgba(235, 35, 64, 0.08), transparent 18%),
    radial-gradient(circle at 86% 22%, rgba(235, 35, 64, 0.06), transparent 16%),
    radial-gradient(circle at 70% 88%, rgba(235, 35, 64, 0.05), transparent 20%),
    #fff8f8;

  @media (max-width: 960px) {
    min-height: 360px;
    padding: 24px;
  }
`;

const VisualHeading = styled.div`
  position: relative;
  z-index: 2;
  display: grid;
  gap: 12px;
  max-width: 360px;
  margin-top: 72px;

  @media (max-width: 960px) {
    margin-top: 24px;
    max-width: 420px;
  }
`;

const VisualKicker = styled.span`
  display: inline-flex;
  width: fit-content;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const VisualTitle = styled.h1`
  margin: 0;
  font-size: clamp(2.4rem, 4vw, 4.2rem);
  line-height: 0.92;
`;

const VisualSubtitle = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.65;
  max-width: 360px;
`;

const VisualIllustration = styled.img`
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  width: min(82%, 520px);
  max-height: 46%;
  object-fit: contain;
  object-position: center bottom;

  @media (max-width: 960px) {
    width: min(100%, 420px);
    max-height: 56%;
    bottom: 0;
  }
`;

const FormPanel = styled.div`
  padding: 34px;
  background: rgba(255, 255, 255, 0.96);
  display: grid;
  align-content: center;

  @media (max-width: 720px) {
    padding: 22px 18px 26px;
  }
`;

const Message = styled.p`
  color: var(--color-muted);
`;

const roleCards = [
  {
    role: "customer" as const,
    title: "Looking for property",
    text: "Search homes, save listings, and keep your inquiries in one account.",
    image: "/assets/auth/createaccount.svg",
  },
  {
    role: "agent" as const,
    title: "I'm an agent",
    text: "Continue into listing submissions, lead follow-up, and agent-facing tools.",
    image: "/assets/auth/createagentaccount.svg",
  },
];

export default function AuthPage() {
  const { user, logout, profileRole, profileReady, authToken } = useAppState();
  const router = useRouter();
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(null);
  const [resumePath, setResumePath] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [authResolvedRole, setAuthResolvedRole] = useState<ProfileRole | null>(null);
  const bootstrapStartedForUser = useRef<string | null>(null);
  const stageLocked = !role && !user;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("kaiten_living_auth_resume");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { resumePath?: string } | null;
      if (parsed?.resumePath) {
        setResumePath(parsed.resumePath);
      }
    } catch {
      setResumePath(null);
    }
  }, []);

  useEffect(() => {
    if (!user || !profileReady) return;

    const effectiveRole = authResolvedRole ?? profileRole;
    const redirectToTarget = (target: string) => {
      setRedirecting(true);
      router.replace(target);
    };

    if (effectiveRole === "vendor_user") {
      if (!authToken) return;
      if (bootstrapStartedForUser.current === user.id) return;

      bootstrapStartedForUser.current = user.id;

      void (async () => {
        const response = await fetch("/api/vendors/bootstrap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ vendorType: "solo_agent" }),
        });

        const payload = (await response.json().catch(() => null)) as { message?: string } | null;

        if (!response.ok) {
          setRedirecting(false);
          setMessage(payload?.message ?? "Unable to set up the vendor workspace.");
          bootstrapStartedForUser.current = null;
          return;
        }

        redirectToTarget("/request-sale");
      })();

      return;
    }

    redirectToTarget(resumePath || "/");
  }, [authResolvedRole, authToken, profileReady, profileRole, resumePath, router, user]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const previousPadding = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "0px";
    return () => {
      document.body.style.paddingBottom = previousPadding;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth > 720) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    if (stageLocked) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.overscrollBehavior = "none";
      document.documentElement.style.overscrollBehavior = "none";
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
    };
  }, [stageLocked]);

  return (
    <Page $stageLocked={stageLocked}>
      <Shell $stageLocked={stageLocked}>
        <TopBar>
          <BackButton type="button" onClick={() => (role ? setRole(null) : router.back())}>
            <ArrowLeft size={16} />
            {role ? "Back to account types" : t("auth.back")}
          </BackButton>
          <Brand href="/">
            <BrandMark>
              <img src="/KTLogo.png" alt="Eain Chan Myay logo" />
            </BrandMark>
            <BrandText>
              <BrandName>EainChanMyay.com</BrandName>
              <BrandSub>{t("site.tagline")}</BrandSub>
            </BrandText>
          </Brand>
        </TopBar>

        {!role && !user ? (
          <StageShell>
            <StageBrand href="/">
              <StageBrandMark>
                <img src="/KTLogo.png" alt="Eain Chan Myay logo" />
              </StageBrandMark>
              <StageBrandName>EainChanMyay.com</StageBrandName>
            </StageBrand>
            <StageHeader>
              <StageTitle>Choose your account</StageTitle>
              <StageSubtitle>
                Start with the right access path. Customers browse and save listings, while agents continue into listing and lead tools.
              </StageSubtitle>
            </StageHeader>
            <RoleGrid>
              {roleCards.map((item) => (
                <RoleCard key={item.role} type="button" onClick={() => setRole(item.role)}>
                <RoleVisual>
                  <VisualLogo>
                    <img src="/KTLogo.png" alt="" aria-hidden="true" />
                    <span>EainChanMyay.com</span>
                  </VisualLogo>
                  <RoleIllustration src={item.image} alt="" aria-hidden="true" />
                </RoleVisual>
                  <RoleBody>
                    <RoleTitle>{item.title}</RoleTitle>
                    <RoleText>{item.text}</RoleText>
                  </RoleBody>
                </RoleCard>
              ))}
            </RoleGrid>
          </StageShell>
        ) : (
          <AuthLayout>
            <VisualPanel>
              <VisualLogo>
                <img src="/KTLogo.png" alt="" aria-hidden="true" />
                <span>EainChanMyay.com</span>
              </VisualLogo>
              <VisualHeading>
                <VisualKicker>{role === "agent" ? "Agent account" : "Customer access"}</VisualKicker>
                <VisualTitle>
                  {role === "agent" ? "Join the agent workspace" : "Sign in to continue your search"}
                </VisualTitle>
                <VisualSubtitle>
                  {role === "agent"
                    ? "Use one account for listings, lead handling, and sale submissions. We can route new agent users into the request flow after sign up."
                    : "Save homes, return to your inquiries, and keep your property search moving without losing context."}
                </VisualSubtitle>
              </VisualHeading>
              <VisualIllustration
                src={role === "agent" ? "/assets/auth/createagentaccount.svg" : "/assets/auth/joinustoday.svg"}
                alt=""
                aria-hidden="true"
              />
            </VisualPanel>

            <FormPanel>
              {!isSupabaseConfigured && <Message>{t("auth.supabaseMissing")}</Message>}
              {user ? (
                <div>
                  <p>{redirecting ? t("auth.redirecting") : t("auth.signingIn")}</p>
                  <BackButton
                    type="button"
                    onClick={async () => {
                      await logout();
                      setMessage(t("auth.signedOut"));
                    }}
                  >
                    {t("common.signOut")}
                  </BackButton>
                </div>
              ) : role ? (
                <AuthScreen
                  role={role}
                  onChangeRole={() => setRole(null)}
                  onSuccess={(resolvedRole) => {
                    setAuthResolvedRole(resolvedRole);
                    if (typeof window !== "undefined") {
                      window.localStorage.removeItem("kaiten_living_auth_resume");
                    }
                  }}
                />
              ) : null}
              {message && <Message>{message}</Message>}
            </FormPanel>
          </AuthLayout>
        )}
      </Shell>
    </Page>
  );
}

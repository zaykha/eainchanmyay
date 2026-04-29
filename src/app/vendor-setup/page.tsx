"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useAppState } from "@/app/living-site/lib/app-state";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";
import { isVendorStorefrontSetupComplete } from "@/lib/vendor-storefront";
import { VENDOR_PLANS, type VendorPlanKey } from "@/lib/vendor-plans";

const AGENT_ONBOARDING_STORAGE_KEY = "kaiten_vendor_onboarding_pending";

const Page = styled.main`
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(255, 61, 93, 0.12), transparent 34%),
    linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 96%, white) 0%, var(--color-paper) 100%);
  color: var(--color-text);
  padding: 28px 18px 40px;
`;

const Shell = styled.div`
  width: min(1120px, 100%);
  margin: 0 auto;
  display: grid;
  gap: 20px;
`;

const Header = styled.div`
  display: grid;
  gap: 10px;
`;

const Eyebrow = styled.span`
  width: fit-content;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  display: inline-flex;
  align-items: center;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.1rem);
  line-height: 0.98;
  color: var(--color-text);
`;

const Copy = styled.p`
  margin: 0;
  max-width: 760px;
  color: var(--color-muted);
  line-height: 1.65;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 1180px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.button<{ $featured?: boolean }>`
  position: relative;
  border-radius: 28px;
  border: 1px solid
    ${(props) =>
      props.$featured ? "color-mix(in srgb, var(--color-primary) 34%, var(--color-outline))" : "var(--color-outline)"};
  background: ${(props) =>
    props.$featured
      ? "linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 10%, var(--color-surface)) 0%, var(--color-surface) 100%)"
      : "var(--color-surface)"};
  padding: 22px;
  display: grid;
  gap: 14px;
  box-shadow: var(--shadow-soft);
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease,
    background 180ms ease;

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 22px 44px rgba(15, 23, 42, 0.12);
    border-color: color-mix(in srgb, var(--color-primary) 28%, var(--color-outline));
  }

  &:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--color-primary) 32%, transparent);
    outline-offset: 3px;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.78;
  }
`;

const CornerBadge = styled.span`
  position: absolute;
  top: 16px;
  right: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff3d5d 0%, #e91b42 100%);
  color: #fff;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
`;

const PlanName = styled.h2`
  margin: 0;
  font-size: 1.35rem;
  color: var(--color-text);
`;

const Price = styled.div`
  color: var(--color-text);
  font-size: 1.8rem;
  font-weight: 800;
`;

const Meta = styled.div`
  display: grid;
  gap: 6px;
  color: var(--color-text);
`;

const MetaItem = styled.div`
  color: var(--color-text);
  font-weight: 600;
`;

const Subtle = styled.div`
  color: var(--color-muted);
  line-height: 1.55;
  min-height: 48px;
`;

const List = styled.div`
  display: grid;
  gap: 8px;
  color: var(--color-text);
  font-size: 0.92rem;
`;

const Item = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`;

const Dot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #ff5d78;
  margin-top: 6px;
  flex: 0 0 auto;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
`;

const CardActionText = styled.span`
  color: var(--color-primary);
  font-weight: 800;
`;

const SecondaryAction = styled.button`
  min-height: 44px;
  width: fit-content;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;
`;

const Message = styled.p`
  margin: 0;
  color: var(--color-primary);
  line-height: 1.55;
`;

type WorkspacePayload = {
  vendor?: {
    id: string;
    name: string;
    plan: string | null;
    billing_status: string | null;
    description?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    logo_url?: string | null;
  };
  error?: string;
};

export default function VendorSetupPage() {
  const router = useRouter();
  const { user, profileReady, profileRole, authToken } = useAppState();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [creatingPlan, setCreatingPlan] = useState<VendorPlanKey | null>(null);
  const [workspace, setWorkspace] = useState<WorkspacePayload["vendor"] | null>(null);
  const [onboardingPending, setOnboardingPending] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOnboardingPending(window.localStorage.getItem(AGENT_ONBOARDING_STORAGE_KEY) === "1");
  }, []);

  const ensureVendorProfileRole = async () => {
    if (!authToken) {
      throw new Error("Missing account session.");
    }

    const response = await fetch("/api/auth/ensure-vendor-role", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      throw new Error(payload?.error || "Unable to prepare the vendor account.");
    }
  };

  useEffect(() => {
    if (!profileReady) return;

    if (!user) {
      router.replace("/auth");
      return;
    }

    if (profileRole !== "vendor_user" && !onboardingPending) {
      setLoading(false);
      return;
    }

    if (!authToken) return;

    let cancelled = false;

    const checkWorkspace = async () => {
      setLoading(true);
      const response = await fetch("/api/vendor/workspace?includeUsage=false", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const payload = (await response.json().catch(() => null)) as WorkspacePayload | null;

      if (cancelled) return;

      if (response.ok && payload?.vendor?.id) {
        setWorkspace(payload.vendor);
        const requiresActiveBilling = payload.vendor.plan && payload.vendor.plan !== "free";
        const storefrontReady = isVendorStorefrontSetupComplete(payload.vendor);
        if (payload.vendor.plan === "free") {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(AGENT_ONBOARDING_STORAGE_KEY);
          }
          router.replace(storefrontReady ? "/hub" : "/agency-setup");
          return;
        }

        if (!requiresActiveBilling || payload.vendor.billing_status === "active") {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(AGENT_ONBOARDING_STORAGE_KEY);
          }
          router.replace(storefrontReady ? "/vendor" : "/agency-setup");
          return;
        }

        setMessage(
          "Your paid workspace is waiting for successful Dinger payment confirmation. Once payment is confirmed, access will unlock automatically."
        );
        setLoading(false);
        return;
      }

      setWorkspace(null);
      setLoading(false);
    };

    void checkWorkspace();

    return () => {
      cancelled = true;
    };
  }, [authToken, onboardingPending, profileReady, profileRole, router, user]);

  const handleCreateFreeWorkspace = async () => {
    if (!authToken) return;
    setCreatingPlan("free");
    setMessage(null);
    try {
      await ensureVendorProfileRole();

      const response = await fetch("/api/vendors/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          vendorType: "agency",
          plan: "free",
        }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to create the free vendor workspace.");
      }

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(AGENT_ONBOARDING_STORAGE_KEY);
      }
      router.replace("/agency-setup");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create the free vendor workspace.");
    } finally {
      setCreatingPlan(null);
    }
  };

  const handleStartPaidCheckout = async (planKey: VendorPlanKey) => {
    if (!authToken || planKey === "free") return;
    setCreatingPlan(planKey);
    setMessage(null);

    try {
      await ensureVendorProfileRole();

      const response = await fetch("/api/vendor/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          plan: planKey,
          vendorType: "agency",
          vendorName: workspace?.name,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { checkoutUrl?: string; error?: string } | null;
      if (!response.ok || !payload?.checkoutUrl) {
        throw new Error(payload?.error ?? "Unable to start Dinger checkout.");
      }

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(AGENT_ONBOARDING_STORAGE_KEY);
      }
      window.location.href = payload.checkoutUrl;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start Dinger checkout.");
      setCreatingPlan(null);
    }
  };

  if (!profileReady || loading) {
    return <LoadingOverlay message="Preparing vendor setup..." />;
  }

  if (!user) {
    return null;
  }

  if (profileRole !== "vendor_user" && !onboardingPending) {
    return (
      <Page>
        <Shell>
          <Header>
            <Eyebrow>Vendor setup</Eyebrow>
            <Title>Vendor access required</Title>
            <Copy>This setup flow is only available for vendor accounts.</Copy>
          </Header>
          <SecondaryAction type="button" onClick={() => router.push("/auth")}>
            Switch account
          </SecondaryAction>
        </Shell>
      </Page>
    );
  }

  return (
    <Page>
      <Shell>
        <Header>
          <Eyebrow>Vendor setup</Eyebrow>
          <Title>Choose how your agency starts</Title>
          <Copy>
            Free agencies can start immediately. Paid plans will require successful payment before the workspace is
            unlocked. If a paid checkout is canceled later, the account stays on Free until upgraded again.
          </Copy>
        </Header>

        {message ? <Message>{message}</Message> : null}

        <Grid>
          {VENDOR_PLANS.map((plan) => {
            const isFree = plan.key === "free";
            const isLoading = creatingPlan === plan.key;
            const isMostPopular = plan.key === "growth";
            const actionLabel = isFree ? "Continue with Free" : `Pay and start ${plan.name}`;
            const loadingLabel = isFree ? "Creating workspace..." : "Redirecting to Dinger...";

            return (
              <Card
                key={plan.key}
                type="button"
                $featured={plan.key === "verified"}
                disabled={Boolean(creatingPlan)}
                onClick={() =>
                  isFree ? void handleCreateFreeWorkspace() : void handleStartPaidCheckout(plan.key)
                }
              >
                {isMostPopular ? <CornerBadge>Most Popular</CornerBadge> : null}
                <div>
                  <PlanName>{plan.name}</PlanName>
                  <Price>{plan.priceLabel}</Price>
                </div>

                <Meta>
                  <MetaItem>{plan.listingLimitLabel}</MetaItem>
                  <MetaItem>{plan.agentLimitLabel}</MetaItem>
                  <MetaItem>
                    {plan.includedVerification ? "Verification included, still manually approved" : "Verification separate"}
                  </MetaItem>
                </Meta>

                <Subtle>{plan.description}</Subtle>

                <List>
                  {plan.highlights.map((item) => (
                    <Item key={item}>
                      <Dot />
                      <span>{item}</span>
                    </Item>
                  ))}
                </List>

                <CardFooter>
                  <CardActionText>{isLoading ? loadingLabel : actionLabel}</CardActionText>
                </CardFooter>
              </Card>
            );
          })}
        </Grid>

        <SecondaryAction type="button" onClick={() => router.push("/")}>
          Back to home
        </SecondaryAction>
      </Shell>
    </Page>
  );
}

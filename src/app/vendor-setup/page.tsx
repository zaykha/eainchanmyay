"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useAppState } from "@/app/living-site/lib/app-state";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";
import { VENDOR_PLANS, type VendorPlanKey } from "@/lib/vendor-plans";

const Page = styled.main`
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(255, 61, 93, 0.14), transparent 34%),
    linear-gradient(180deg, #0b0f18 0%, #131b2b 100%);
  color: #eef2ff;
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
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
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
  color: #f8fafc;
`;

const Copy = styled.p`
  margin: 0;
  max-width: 760px;
  color: #a9b3c7;
  line-height: 1.65;
`;

const Notice = styled.div`
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  padding: 18px;
  color: #d8deea;
  line-height: 1.6;
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

const Card = styled.section<{ $featured?: boolean }>`
  border-radius: 28px;
  border: 1px solid ${(props) => (props.$featured ? "rgba(255, 61, 93, 0.38)" : "rgba(255, 255, 255, 0.08)")};
  background: ${(props) => (props.$featured ? "linear-gradient(180deg, rgba(255,61,93,0.12), rgba(21,27,41,0.96))" : "#151b29")};
  padding: 22px;
  display: grid;
  gap: 14px;
`;

const PlanName = styled.h2`
  margin: 0;
  font-size: 1.35rem;
  color: #f8fafc;
`;

const Price = styled.div`
  color: #f8fafc;
  font-size: 1.8rem;
  font-weight: 800;
`;

const Meta = styled.div`
  display: grid;
  gap: 6px;
  color: #dbe2ef;
`;

const MetaItem = styled.div`
  color: #dbe2ef;
  font-weight: 600;
`;

const Subtle = styled.div`
  color: #98a2b3;
  line-height: 1.55;
  min-height: 48px;
`;

const List = styled.div`
  display: grid;
  gap: 8px;
  color: #dbe2ef;
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

const Action = styled.button`
  min-height: 46px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #ff3d5d 0%, #e91b42 100%);
  color: white;
  font-weight: 800;
  cursor: pointer;
`;

const SecondaryAction = styled.button`
  min-height: 44px;
  width: fit-content;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: #eef2ff;
  font-weight: 700;
  cursor: pointer;
`;

const Message = styled.p`
  margin: 0;
  color: #ffb7c3;
  line-height: 1.55;
`;

type WorkspacePayload = {
  vendor?: {
    id: string;
    name: string;
    plan: string | null;
    billing_status: string | null;
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

  useEffect(() => {
    if (!profileReady) return;

    if (!user) {
      router.replace("/auth");
      return;
    }

    if (profileRole !== "vendor_user") {
      setLoading(false);
      return;
    }

    if (!authToken) return;

    let cancelled = false;

    const checkWorkspace = async () => {
      setLoading(true);
      const response = await fetch("/api/vendor/workspace", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const payload = (await response.json().catch(() => null)) as WorkspacePayload | null;

      if (cancelled) return;

      if (response.ok && payload?.vendor?.id) {
        setWorkspace(payload.vendor);
        const requiresActiveBilling = payload.vendor.plan && payload.vendor.plan !== "free";
        if (!requiresActiveBilling || payload.vendor.billing_status === "active") {
          router.replace("/vendor");
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
  }, [authToken, profileReady, profileRole, router, user]);

  const handleCreateFreeWorkspace = async () => {
    if (!authToken) return;
    setCreatingPlan("free");
    setMessage(null);
    try {
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

      router.replace("/vendor");
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

  if (profileRole !== "vendor_user") {
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

        <Notice>
          Paid plans stay blocked until Dinger confirms payment. If checkout is canceled or fails, the account falls
          back to Free and can upgrade again later.
        </Notice>

        {message ? <Message>{message}</Message> : null}

        <Grid>
          {VENDOR_PLANS.map((plan) => {
            const isFree = plan.key === "free";
            const isLoading = creatingPlan === plan.key;

            return (
              <Card key={plan.key} $featured={plan.key === "verified"}>
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

                {isFree ? (
                  <Action type="button" onClick={handleCreateFreeWorkspace} disabled={isLoading}>
                    {isLoading ? "Creating workspace..." : "Continue with Free"}
                  </Action>
                ) : (
                  <Action type="button" onClick={() => void handleStartPaidCheckout(plan.key)} disabled={isLoading}>
                    {isLoading ? "Redirecting to Dinger..." : `Pay and start ${plan.name}`}
                  </Action>
                )}
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

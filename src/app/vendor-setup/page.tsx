"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useAppState } from "@/app/living-site/lib/app-state";
import { VendorPlanSelection } from "@/app/living-site/components/vendor/VendorPlanSelection";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";
import { useI18n } from "@/app/living-site/lib/i18n";
import { isVendorStorefrontSetupComplete } from "@/lib/vendor-storefront";
import type { VendorPlanKey } from "@/lib/vendor-plans";

const AGENT_ONBOARDING_STORAGE_KEY = "kaiten_vendor_onboarding_pending";

const Page = styled.main`
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(255, 61, 93, 0.12), transparent 34%),
    linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 96%, white) 0%, var(--color-paper) 100%);
  color: var(--color-text);
  padding: 28px 18px 40px;
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

const AccessCard = styled.div`
  width: min(760px, 100%);
  margin: 0 auto;
  display: grid;
  gap: 16px;
`;

const AccessActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const SecondaryAction = styled.button`
  min-height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: transparent;
  color: #1f2937;
  font-weight: 700;
  cursor: pointer;
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
  const { t } = useI18n();
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
      throw new Error(t("vendorSetup.missingSession"));
    }

    const response = await fetch("/api/auth/ensure-vendor-role", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      throw new Error(payload?.error || t("vendorSetup.prepareAccount"));
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
          router.replace(storefrontReady ? "/hub" : "/agency-setup");
          return;
        }

        setMessage(
          t("vendorSetup.pendingPaid")
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
        throw new Error(payload?.message ?? t("vendorSetup.createFreeFailed"));
      }

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(AGENT_ONBOARDING_STORAGE_KEY);
      }
      router.replace("/agency-setup");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("vendorSetup.createFreeFailed"));
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
        throw new Error(payload?.error ?? t("vendorSetup.startCheckoutFailed"));
      }

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(AGENT_ONBOARDING_STORAGE_KEY);
      }
      window.location.href = payload.checkoutUrl;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("vendorSetup.startCheckoutFailed"));
      setCreatingPlan(null);
    }
  };

  if (!profileReady || loading) {
    return <LoadingOverlay message={t("vendorSetup.loading")} />;
  }

  if (!user) {
    return null;
  }

  if (profileRole !== "vendor_user" && !onboardingPending) {
    return (
      <Page>
        <AccessCard>
          <Eyebrow>{t("vendorSetup.eyebrow")}</Eyebrow>
          <Title>{t("vendorSetup.accessTitle")}</Title>
          <Copy>{t("vendorSetup.accessCopy")}</Copy>
          <AccessActions>
            <SecondaryAction type="button" onClick={() => router.push("/auth")}>
              {t("vendorSetup.switchAccount")}
            </SecondaryAction>
          </AccessActions>
        </AccessCard>
      </Page>
    );
  }

  return (
    <Page>
      <VendorPlanSelection
        mode="setup"
        creatingPlan={creatingPlan}
        message={message}
        onSelectFree={() => void handleCreateFreeWorkspace()}
        onSelectPaid={(planKey) => void handleStartPaidCheckout(planKey)}
        onBack={() => router.push("/")}
      />
    </Page>
  );
}

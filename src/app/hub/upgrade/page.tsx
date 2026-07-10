"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { MarketplaceHeader } from "@/features/site/shared/components/MarketplaceHeader";
import { VendorPlanSelection } from "@/features/site/vendor/components/VendorPlanSelection";
import { LoadingOverlay } from "@/features/site/shared/components/LoadingOverlay";
import { useAppState } from "@/features/site/shared/lib/app-state";
import { readActiveVendorWorkspace, withActiveVendorHeaders } from "@/features/site/vendor/lib/active-context";
import { useI18n } from "@/features/site/shared/lib/i18n";
import type { VendorPlanKey } from "@/lib/vendor-plans";

const Page = styled.main`
  min-height: 100vh;
  color: var(--color-text);
  padding: 16px 16px 40px;
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
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.15);
  padding: 22px;
  display: grid;
  gap: 14px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.35rem;
  color: #111827;
`;

const ModalText = styled.p`
  margin: 0;
  color: #4b5563;
  line-height: 1.65;
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
  };
  membership?: {
    role?: string | null;
  };
  error?: string;
};

export default function HubUpgradePage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, profileReady, profileRole, authToken } = useAppState();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [creatingPlan, setCreatingPlan] = useState<VendorPlanKey | null>(null);
  const [workspace, setWorkspace] = useState<WorkspacePayload["vendor"] | null>(null);

  const [upgradeGateError, setUpgradeGateError] = useState<
    | null
    | {
        title: string;
        text: string;
        primaryLabel: string;
        onPrimary: () => void;
      }
  >(null);

  const upgradeGateKey = useMemo(() => {
    // helps avoid stale error messages during rapid navigation
    return `${profileReady}-${profileRole}-${Boolean(authToken)}`;
  }, [authToken, profileReady, profileRole]);

  useEffect(() => {
    // reset gate UI when auth context changes
    setUpgradeGateError(null);
  }, [upgradeGateKey]);

  useEffect(() => {
    if (!profileReady) return;

    if (!user || profileRole !== "vendor_user" || !authToken) {
      router.replace("/hub");
      return;
    }

    let cancelled = false;

    const loadWorkspace = async () => {
      setLoading(true);
      setMessage(null);
      const activeVendorId = readActiveVendorWorkspace(user.id);

      const response = await fetch("/api/vendor/workspace?includeUsage=false", {
        headers: withActiveVendorHeaders(
          {
            Authorization: `Bearer ${authToken}`,
          },
          activeVendorId
        ),
      });

      const payload = (await response.json().catch(() => null)) as WorkspacePayload | null;

      if (cancelled) return;

      if (!response.ok || !payload) {
        // For upgrade gating we only show custom UI on 403;
        // anything else keeps existing behavior (redirect back to hub).
        if (response.status === 403) {
          const errorMessage = payload?.error ?? "";

          if (errorMessage === "Vendor membership not found.") {
            setUpgradeGateError({
              title: t("upgrade.setupFirstTitle"),
              text: t("upgrade.setupFirstCopy"),
              primaryLabel: t("upgrade.setupAgency"),
              onPrimary: () => router.replace("/agency-setup"),
            });
            setLoading(false);
            return;
          }

          setUpgradeGateError({
            title: t("upgrade.ownAgencyTitle"),
            text: t("upgrade.ownAgencyCopy"),
            primaryLabel: t("upgrade.backToHub"),
            onPrimary: () => router.replace("/hub"),
          });
          setLoading(false);
          return;
        }

        router.replace("/hub");
        return;
      }

      if (!payload.vendor?.id) {
        // Preserve existing redirect behavior for unexpected missing payload
        router.replace("/hub");
        return;
      }

      const workspaceRole = String(payload.membership?.role ?? "").trim().toLowerCase();
      if (workspaceRole !== "owner") {
        setUpgradeGateError({
          title: t("upgrade.ownerOnlyTitle"),
          text: t("upgrade.ownerOnlyCopy"),
          primaryLabel: t("upgrade.backToHub"),
          onPrimary: () => router.replace("/hub"),
        });
        setLoading(false);
        return;
      }

      setWorkspace(payload.vendor);
      setLoading(false);
    };

    void loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [authToken, profileReady, profileRole, router, t, user]);

  const handleStartPaidCheckout = async (planKey: VendorPlanKey) => {
    if (!authToken || !user || planKey === "free") return;
    setCreatingPlan(planKey);
    setMessage(null);

    try {
      const activeVendorId = readActiveVendorWorkspace(user.id);
      const response = await fetch("/api/vendor/billing/checkout", {
        method: "POST",
        headers: withActiveVendorHeaders(
          {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          activeVendorId
        ),
        body: JSON.stringify({
          plan: planKey,
          vendorType: "agency",
          vendorName: workspace?.name,
          vendorId: activeVendorId,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { checkoutUrl?: string; error?: string }
        | null;

      if (!response.ok || !payload?.checkoutUrl) {
        throw new Error(payload?.error ?? t("upgrade.startCheckoutFailed"));
      }

      window.location.href = payload.checkoutUrl;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("upgrade.startCheckoutFailed"));
      setCreatingPlan(null);
    }
  };

  if (!profileReady || loading) {
    return <LoadingOverlay message={t("upgrade.loading")} />;
  }

  // If upgrade gating is triggered, show popup instead of the plan grid.
  if (upgradeGateError) {
    return (
      <div>
        <MarketplaceHeader />
        <ModalOverlay role="alertdialog" aria-modal="true" onClick={() => setUpgradeGateError(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{upgradeGateError.title}</ModalTitle>
            <ModalText>{upgradeGateError.text}</ModalText>
            <AccessActions>
              <SecondaryAction type="button" onClick={() => setUpgradeGateError(null)}>
                {t("common.back")}
              </SecondaryAction>
              <PrimaryAction
                type="button"
                onClick={() => {
                  const handler = upgradeGateError.onPrimary;
                  // close first so user sees immediate feedback
                  setUpgradeGateError(null);
                  handler();
                }}
              >
                {upgradeGateError.primaryLabel}
              </PrimaryAction>
            </AccessActions>
          </ModalCard>
        </ModalOverlay>
      </div>
    );
  }

  return (
    <div>
      <MarketplaceHeader />
      <Page>
        <VendorPlanSelection
          mode="upgrade"
          creatingPlan={creatingPlan}
          message={message}
          currentPlan={(workspace?.plan as VendorPlanKey | null | undefined) ?? "free"}
          onSelectPaid={(planKey) => void handleStartPaidCheckout(planKey)}
          onBack={() => router.push("/hub")}
        />
      </Page>
    </div>
  );
}

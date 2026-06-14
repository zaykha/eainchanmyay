"use client";

import styled from "styled-components";
import { useI18n } from "@/features/site/shared/lib/i18n";
import { VENDOR_PLANS, type VendorPlanKey } from "@/lib/vendor-plans";

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

const Card = styled.button<{ $featured?: boolean; $current?: boolean }>`
  position: relative;
  border-radius: 28px;
  border: 1px solid
    ${(props) =>
      props.$current
        ? "color-mix(in srgb, #10b981 34%, var(--color-outline))"
        : props.$featured
          ? "color-mix(in srgb, var(--color-primary) 34%, var(--color-outline))"
          : "var(--color-outline)"};
  background: ${(props) =>
    props.$current
      ? "linear-gradient(180deg, color-mix(in srgb, #10b981 8%, var(--color-surface)) 0%, var(--color-surface) 100%)"
      : props.$featured
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
    cursor: default;
    opacity: 0.82;
  }
`;

const CornerBadge = styled.span<{ $current?: boolean }>`
  position: absolute;
  top: 16px;
  right: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: ${(props) =>
    props.$current ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #ff3d5d 0%, #e91b42 100%)"};
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

type Props = {
  mode: "setup" | "upgrade";
  creatingPlan: VendorPlanKey | null;
  message: string | null;
  currentPlan?: VendorPlanKey | null;
  onSelectFree?: () => void;
  onSelectPaid: (planKey: VendorPlanKey) => void;
  onBack: () => void;
};

export function VendorPlanSelection({
  mode,
  creatingPlan,
  message,
  currentPlan,
  onSelectFree,
  onSelectPaid,
  onBack,
}: Props) {
  const { t } = useI18n();
  const eyebrow = mode === "setup" ? t("vendorPlan.setupEyebrow") : t("vendorPlan.upgradeEyebrow");
  const title = mode === "setup" ? t("vendorPlan.setupTitle") : t("vendorPlan.upgradeTitle");
  const copy =
    mode === "setup"
      ? t("vendorPlan.setupCopy")
      : t("vendorPlan.upgradeCopy");
  const currentPlanIndex = VENDOR_PLANS.findIndex((plan) => plan.key === currentPlan);

  return (
    <Shell>
      <Header>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Title>{title}</Title>
        <Copy>{copy}</Copy>
      </Header>

      {message ? <Message>{message}</Message> : null}

      <Grid>
        {VENDOR_PLANS.map((plan) => {
          const isFree = plan.key === "free";
          const isCurrent = currentPlan === plan.key;
          const planIndex = VENDOR_PLANS.findIndex((item) => item.key === plan.key);
          const isLockedBelowCurrent =
            mode === "upgrade" &&
            currentPlanIndex >= 0 &&
            planIndex >= 0 &&
            planIndex < currentPlanIndex;
          const isLoading = creatingPlan === plan.key;
          const isMostPopular = plan.key === "growth" && !isCurrent;
          const disabled =
            Boolean(creatingPlan) ||
            isCurrent ||
            isLockedBelowCurrent ||
            (mode === "upgrade" && isFree) ||
            (mode === "setup" && isFree && !onSelectFree);
          const actionLabel =
            mode === "setup"
              ? isFree
                ? t("vendorPlan.action.continueFree")
                : t("vendorPlan.action.payAndStart", { plan: t(`vendorPlan.${plan.key}.name`) })
              : isLockedBelowCurrent
                ? t("vendorPlan.action.currentTierHigher")
              : isCurrent
                ? t("vendorPlan.action.currentPlan")
              : isFree
                  ? t("vendorPlan.action.alreadyActive")
                  : t("vendorPlan.action.upgradeTo", { plan: t(`vendorPlan.${plan.key}.name`) });
          const loadingLabel = isFree
            ? t("vendorPlan.loading.creatingWorkspace")
            : t("vendorPlan.loading.redirectingToDinger");

          return (
            <Card
              key={plan.key}
              type="button"
              $featured={plan.key === "verified"}
              $current={isCurrent}
              disabled={disabled}
              onClick={() => {
                if (isCurrent) return;
                if (isFree) {
                  onSelectFree?.();
                  return;
                }
                onSelectPaid(plan.key);
              }}
            >
              {isCurrent ? (
                <CornerBadge $current>{t("vendorPlan.badge.current")}</CornerBadge>
              ) : isMostPopular ? (
                <CornerBadge>{t("vendorPlan.badge.popular")}</CornerBadge>
              ) : null}
              <div>
                <PlanName>{t(`vendorPlan.${plan.key}.name`)}</PlanName>
                <Price>{plan.priceLabel}</Price>
              </div>

              <Meta>
                <MetaItem>{t(`vendorPlan.${plan.key}.listingLimit`)}</MetaItem>
                <MetaItem>{t(`vendorPlan.${plan.key}.agentLimit`)}</MetaItem>
                <MetaItem>
                  {plan.includedVerification ? t("vendorPlan.verificationIncluded") : t("vendorPlan.verificationSeparate")}
                </MetaItem>
              </Meta>

              <Subtle>{t(`vendorPlan.${plan.key}.description`)}</Subtle>

              <List>
                {[1, 2, 3].map((index) => (
                  <Item key={`${plan.key}-highlight-${index}`}>
                    <Dot />
                    <span>{t(`vendorPlan.${plan.key}.highlight${index}`)}</span>
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

      <SecondaryAction type="button" onClick={onBack}>
        {mode === "setup" ? t("vendorPlan.backHome") : t("vendorPlan.backHub")}
      </SecondaryAction>
    </Shell>
  );
}

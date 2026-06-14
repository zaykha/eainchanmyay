"use client";

import styled from "styled-components";
import { MarketplaceHeader } from "@/features/site/shared/components/MarketplaceHeader";
import { SectionTitle } from "@/features/site/shared/components/PageSection";
import { EAIN_CONTACT_PHONE } from "@/features/site/shared/lib/constants";
import { useI18n } from "@/features/site/shared/lib/i18n";

const PageShell = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 16px;
  display: grid;
  gap: 16px;
`;

const Card = styled.div`
  background: var(--color-surface);
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  box-shadow: var(--shadow-soft);
  padding: 18px;
  display: grid;
  gap: 10px;
`;

const Muted = styled.p`
  margin: 0;
  color: var(--color-muted);
`;

export default function ContactRequestsPage() {
  const { t } = useI18n();
  return (
    <div>
      <MarketplaceHeader />
      <PageShell>
        <SectionTitle>{t("bookings.title")}</SectionTitle>
        <Card>
          <strong>{t("bookings.emptyTitle")}</strong>
          <Muted>
            {t("bookings.emptyBody")}{" "}
            <a href={`tel:${EAIN_CONTACT_PHONE}`}>{EAIN_CONTACT_PHONE}</a>{" "}
            {t("bookings.emptyBodySuffix")}
          </Muted>
        </Card>
      </PageShell>
    </div>
  );
}

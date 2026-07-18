"use client";

import styled from "styled-components";
import Link from "next/link";
import { MarketplaceHeader } from "@/features/site/shared/components/MarketplaceHeader";
import { PageSection, SectionTitle, Panel } from "@/features/site/shared/components/PageSection";
import { useI18n } from "@/features/site/shared/lib/i18n";

const PageShell = styled(PageSection)`
  gap: 16px;
`;

const BackLink = styled(Link)`
  width: fit-content;
  border: 1px solid var(--color-outline);
  border-radius: 999px;
  padding: 10px 14px;
  background: #fff;
  color: var(--color-text);
  font-weight: 600;
`;

const SectionCard = styled(Panel)`
  display: grid;
  gap: 12px;
`;

const Question = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const Answer = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.5;
`;

const BulletList = styled.ul`
  margin: 0;
  padding-left: 18px;
  color: var(--color-muted);
  display: grid;
  gap: 6px;
`;

export default function FaqPage() {
  const { t } = useI18n();
  return (
    <div>
      <MarketplaceHeader />
      <PageShell>
        <BackLink href="/settings">{t("common.back")}</BackLink>
        <SectionTitle>{t("faq.title")}</SectionTitle>
        <SectionCard>
          <Question>{t("faq.q1")}</Question>
          <Answer>{t("faq.a1")}</Answer>
        </SectionCard>
        <SectionCard>
          <Question>{t("faq.q2")}</Question>
          <Answer>{t("faq.a2")}</Answer>
        </SectionCard>
        <SectionCard>
          <Question>{t("faq.q3")}</Question>
          <Answer>{t("faq.a3")}</Answer>
        </SectionCard>
        <SectionCard>
          <Question>{t("faq.q4")}</Question>
          <Answer>{t("faq.a4")}</Answer>
        </SectionCard>
        <SectionCard>
          <Question>{t("faq.q5")}</Question>
          <Answer>{t("faq.a5")}</Answer>
        </SectionCard>
        <SectionCard>
          <Question>{t("faq.q6")}</Question>
          <BulletList>
            <li>{t("faq.b1")}</li>
            <li>{t("faq.b2")}</li>
            <li>{t("faq.b3")}</li>
            <li>{t("faq.b4")}</li>
            <li>{t("faq.b5")}</li>
          </BulletList>
        </SectionCard>
      </PageShell>
    </div>
  );
}

"use client";

import styled from "styled-components";
import { MarketplaceHeader } from "@/app/living-site/components/MarketplaceHeader";
import { PageSection, SectionTitle, Panel } from "@/app/living-site/components/PageSection";
import { useI18n } from "@/app/living-site/lib/i18n";

const PageShell = styled(PageSection)`
  gap: 16px;
`;

const SectionCard = styled(Panel)`
  display: grid;
  gap: 10px;
`;

const Heading = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const Paragraph = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.6;
`;

const List = styled.ul`
  margin: 0;
  padding-left: 18px;
  color: var(--color-muted);
  display: grid;
  gap: 6px;
`;

export default function PrivacyPage() {
  const { t } = useI18n();
  const sections = [
    { title: t("privacy.s1.title"), body: t("privacy.s1.body") },
    { title: t("privacy.s2.title"), list: [t("privacy.s2.l1"), t("privacy.s2.l2"), t("privacy.s2.l3"), t("privacy.s2.l4")] },
    { title: t("privacy.s3.title"), list: [t("privacy.s3.l1"), t("privacy.s3.l2"), t("privacy.s3.l3"), t("privacy.s3.l4")] },
    { title: t("privacy.s4.title"), body: t("privacy.s4.body") },
    { title: t("privacy.s5.title"), body: t("privacy.s5.body") },
    { title: t("privacy.s6.title"), body: t("privacy.s6.body") },
    { title: t("privacy.s7.title"), body: t("privacy.s7.body") },
    { title: t("privacy.s8.title"), list: [t("privacy.s8.l1"), t("privacy.s8.l2"), t("privacy.s8.l3"), t("privacy.s8.l4")] },
    { title: t("privacy.s9.title"), body: t("privacy.s9.body") },
    { title: t("privacy.s10.title"), body: t("privacy.s10.body") },
  ];
  return (
    <div>
      <MarketplaceHeader />
      <PageShell>
        <SectionTitle>{t("privacy.title")}</SectionTitle>
        {sections.map((section) => (
          <SectionCard key={section.title}>
            <Heading>{section.title}</Heading>
            {section.body ? <Paragraph>{section.body}</Paragraph> : null}
            {section.list ? (
              <List>
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </List>
            ) : null}
          </SectionCard>
        ))}
      </PageShell>
    </div>
  );
}

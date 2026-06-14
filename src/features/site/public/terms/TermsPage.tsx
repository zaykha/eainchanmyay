"use client";

import styled from "styled-components";
import { MarketplaceHeader } from "@/features/site/shared/components/MarketplaceHeader";
import { PageSection, SectionTitle, Panel } from "@/features/site/shared/components/PageSection";
import { useI18n } from "@/features/site/shared/lib/i18n";

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

export default function TermsPage() {
  const { t } = useI18n();
  const sections = [
    { title: t("terms.s1.title"), body: t("terms.s1.body") },
    { title: t("terms.s2.title"), body: t("terms.s2.body") },
    {
      title: t("terms.s3.title"),
      body: t("terms.s3.body"),
      list: [t("terms.s3.l1"), t("terms.s3.l2")],
    },
    { title: t("terms.s4.title"), list: [t("terms.s4.l1"), t("terms.s4.l2"), t("terms.s4.l3"), t("terms.s4.l4")] },
    { title: t("terms.s5.title"), list: [t("terms.s5.l1"), t("terms.s5.l2"), t("terms.s5.l3"), t("terms.s5.l4")] },
    { title: t("terms.s6.title"), body: t("terms.s6.body") },
    { title: t("terms.s7.title"), body: t("terms.s7.body") },
    { title: t("terms.s8.title"), body: t("terms.s8.body") },
    { title: t("terms.s9.title"), body: t("terms.s9.body") },
    { title: t("terms.s10.title"), body: t("terms.s10.body") },
    { title: t("terms.s11.title"), body: t("terms.s11.body") },
    { title: t("terms.s12.title"), body: t("terms.s12.body") },
    { title: t("terms.s13.title"), body: t("terms.s13.body") },
    { title: t("terms.s14.title"), body: t("terms.s14.body") },
    { title: t("terms.s15.title"), body: t("terms.s15.body") },
  ];
  return (
    <div>
      <MarketplaceHeader />
      <PageShell>
        <SectionTitle>{t("terms.title")}</SectionTitle>
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

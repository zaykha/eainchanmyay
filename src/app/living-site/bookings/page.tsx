"use client";

import styled from "styled-components";
import { SiteHeader } from "@/app/living-site/components/SiteHeader";
import { BottomNav } from "@/app/living-site/components/BottomNav";
import { SectionTitle } from "@/app/living-site/components/PageSection";
import { EAIN_CONTACT_PHONE } from "@/app/living-site/lib/constants";

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
  return (
    <div>
      <SiteHeader />
      <PageShell>
        <SectionTitle>Contact requests</SectionTitle>
        <Card>
          <strong>No contact requests yet</strong>
          <Muted>
            When you reach out to owners or agents, your requests will appear
            here. For now, call our team at{" "}
            <a href={`tel:${EAIN_CONTACT_PHONE}`}>{EAIN_CONTACT_PHONE}</a> for help.
          </Muted>
        </Card>
      </PageShell>
      <BottomNav />
    </div>
  );
}

"use client";

import styled from "styled-components";
import { SiteHeader } from "@/app/living-site/components/SiteHeader";
import { BottomNav } from "@/app/living-site/components/BottomNav";
import { useAppState } from "@/app/living-site/lib/app-state";
import { useRouter } from "next/navigation";

const PageShell = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 16px;
  display: grid;
  gap: 16px;
`;

const SectionLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const Card = styled.div`
  background: var(--color-surface);
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  box-shadow: var(--shadow-soft);
  padding: 16px;
  display: grid;
  gap: 12px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
`;

const PrimaryButton = styled.button`
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  padding: 8px 14px;
  background: var(--gradient);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--frame-shadow);
`;

const SecondaryButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 8px 14px;
  background: var(--color-surface);
  font-weight: 600;
  cursor: pointer;
`;

const RowText = styled.div`
  display: grid;
  gap: 4px;
`;

const Muted = styled.span`
  color: var(--color-muted);
  font-size: 0.9rem;
`;

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAppState();

  return (
    <div>
      <SiteHeader />
      <PageShell>
        <SectionLabel>Account</SectionLabel>
        <h2>Settings</h2>
        <Card>
          <Row>
            <RowText>
              <strong>{user ? "Signed in" : "Not logged in"}</strong>
              <Muted>{user ? user.email : "Login to save your property leads"}</Muted>
            </RowText>
            {!user ? (
              <PrimaryButton type="button" onClick={() => router.push("/auth")}>
                Login
              </PrimaryButton>
            ) : (
              <SecondaryButton type="button" onClick={() => router.push("/auth")}>
                Account
              </SecondaryButton>
            )}
          </Row>
        </Card>
        <Card>
          <Row>
            <RowText>
              <strong>FAQ & Support</strong>
              <Muted>How to buy, rent, and contact owners</Muted>
            </RowText>
            <SecondaryButton type="button">Open</SecondaryButton>
          </Row>
          <Row>
            <RowText>
              <strong>Language</strong>
              <Muted>English</Muted>
            </RowText>
            <SecondaryButton type="button">English</SecondaryButton>
          </Row>
          <Row>
            <RowText>
              <strong>App Version</strong>
              <Muted>1.0.0</Muted>
            </RowText>
          </Row>
          <Row>
            <RowText>
              <strong>Support</strong>
              <Muted>Need help? Reach out to our property team.</Muted>
            </RowText>
            <SecondaryButton type="button">Contact support</SecondaryButton>
          </Row>
          <Row>
            <RowText>
              <strong>Terms & Conditions</strong>
              <Muted>Read how we handle property leads.</Muted>
            </RowText>
            <SecondaryButton type="button">View terms</SecondaryButton>
          </Row>
          <Row>
            <RowText>
              <strong>Privacy Policy</strong>
              <Muted>Learn how we protect your data.</Muted>
            </RowText>
            <SecondaryButton type="button">View privacy</SecondaryButton>
          </Row>
        </Card>
      </PageShell>
      <BottomNav />
    </div>
  );
}

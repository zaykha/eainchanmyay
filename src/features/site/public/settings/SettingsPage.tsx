"use client";

import styled from "styled-components";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarketplaceHeader } from "@/app/living-site/components/MarketplaceHeader";
import { useI18n } from "@/app/living-site/lib/i18n";
import { useLanguage } from "@/app/living-site/components/Providers";
import { useAppState } from "@/app/living-site/lib/app-state";

const PageShell = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 16px;
  display: grid;
  gap: 16px;

  @media (max-width: 640px) {
    font-size: 0.9rem;
  }
`;

const SettingsTitle = styled.h2`
  margin: 6px 0 4px;

  @media (max-width: 640px) {
    margin: 4px 0 2px;
  }
`;

const Card = styled.div`
  background: var(--color-surface-2);
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

const SecondaryButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 8px 14px;
  background: var(--color-surface-2);
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  min-width: 108px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  white-space: nowrap;
`;

const Select = styled.select`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 8px 14px;
  background: var(--color-surface-2);
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  min-width: 108px;
  height: 40px;
`;

const Divider = styled.div`
  height: 1px;
  background: color-mix(in srgb, var(--color-outline) 40%, transparent);
  margin: 4px 0;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--color-paper) 55%, transparent);
  display: grid;
  place-items: center;
  z-index: 90;
  padding: 16px;
`;

const ModalCard = styled.div`
  background: var(--color-surface);
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  box-shadow: var(--shadow-soft);
  width: min(560px, 94vw);
  padding: 16px;
  display: grid;
  gap: 12px;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: var(--frame-shadow);
    pointer-events: none;
  }
`;

const Field = styled.label`
  display: grid;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--color-muted);
`;

const Input = styled.input`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  background: var(--color-surface);
  color: var(--color-text);
`;

const Textarea = styled.textarea`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  background: var(--color-surface);
  color: var(--color-text);
  min-height: 120px;
  resize: vertical;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
`;

const RowText = styled.div`
  display: grid;
  gap: 4px;

  @media (max-width: 640px) {
    strong {
      font-weight: 500;
    }
  }
`;

const Muted = styled.span`
  color: var(--color-muted);
  font-size: 0.9rem;

  @media (max-width: 640px) {
    display: block;
    font-size: 0.72rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const MobileOnly = styled.span`
  display: none;

  @media (max-width: 640px) {
    display: inline;
  }
`;

const DesktopOnly = styled.span`
  display: inline;

  @media (max-width: 640px) {
    display: none;
  }
`;

export default function SettingsPage() {
  const router = useRouter();
  const { t, language } = useI18n();
  const { setLanguage } = useLanguage();
  const { user, logout } = useAppState();
  const [contactOpen, setContactOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactTopic, setContactTopic] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactError, setContactError] = useState(false);

  const handleContactSubmit = () => {
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setContactError(true);
      return;
    }
    setContactError(false);
    const subject = `[Support] ${contactTopic.trim() || "Inquiry"}`;
    const body = [
      `Name: ${contactName}`,
      `Email: ${contactEmail}`,
      contactPhone ? `Phone: ${contactPhone}` : null,
      "",
      contactMessage,
    ]
      .filter(Boolean)
      .join("\n");
    const mailto = `mailto:ak.bjcs@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    if (typeof window !== "undefined") {
      window.location.href = mailto;
    }
    setContactOpen(false);
  };

  return (
    <div>
      <MarketplaceHeader />
      <PageShell>
        <SettingsTitle>{t("settings.title")}</SettingsTitle>
        <Card>
          <Row>
            <RowText>
              <strong>{t("settings.faq")}</strong>
              <Muted>{t("settings.faqDesc")}</Muted>
            </RowText>
            <SecondaryButton type="button" onClick={() => router.push("/faq")}>
              {t("settings.open")}
            </SecondaryButton>
          </Row>
          <Divider />
          <Row>
            <RowText>
              <strong>{t("settings.language")}</strong>
              <Muted>{language === "mm" ? "မြန်မာ" : language === "zh" ? "中文" : language === "th" ? "ไทย" : "English"}</Muted>
            </RowText>
            <Select
              value={language}
              onChange={(event) => setLanguage(event.target.value as "mm" | "en" | "zh" | "th")}
            >
              <option value="mm">မြန်မာ</option>
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="th">ไทย</option>
            </Select>
          </Row>
          <Divider />
          <Row>
            <RowText>
              <strong>{t("settings.appVersion")}</strong>
              <Muted>1.0.0</Muted>
            </RowText>
          </Row>
          <Divider />
          <Row>
            <RowText>
              <strong>{t("settings.support")}</strong>
              <Muted>{t("settings.supportDesc")}</Muted>
            </RowText>
            <SecondaryButton type="button" onClick={() => setContactOpen(true)}>
              <DesktopOnly>{t("settings.contact")}</DesktopOnly>
              <MobileOnly>{t("settings.contactShort")}</MobileOnly>
            </SecondaryButton>
          </Row>
          <Divider />
          <Row>
            <RowText>
              <strong>{t("settings.terms")}</strong>
              <Muted>{t("settings.termsDesc")}</Muted>
            </RowText>
            <SecondaryButton type="button" onClick={() => router.push("/terms")}>
              <DesktopOnly>{t("settings.viewTerms")}</DesktopOnly>
              <MobileOnly>{t("settings.view")}</MobileOnly>
            </SecondaryButton>
          </Row>
          <Divider />
          <Row>
            <RowText>
              <strong>{t("settings.privacy")}</strong>
              <Muted>{t("settings.privacyDesc")}</Muted>
            </RowText>
            <SecondaryButton type="button" onClick={() => router.push("/privacy")}>
              <DesktopOnly>{t("settings.viewPrivacy")}</DesktopOnly>
              <MobileOnly>{t("settings.view")}</MobileOnly>
            </SecondaryButton>
          </Row>
          {user && (
            <>
              <Divider />
              <Row>
                <RowText>
                  <strong>{t("settings.logout")}</strong>
                  <Muted>{t("settings.logoutDesc")}</Muted>
                </RowText>
                <SecondaryButton
                  type="button"
                  onClick={async () => {
                    await logout();
                    router.push("/");
                  }}
                >
                  {t("common.signOut")}
                </SecondaryButton>
              </Row>
            </>
          )}
        </Card>
      </PageShell>
      {contactOpen && (
        <ModalOverlay onClick={() => setContactOpen(false)}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <strong>{t("settings.contactTitle")}</strong>
            <Field>
              {t("settings.name")}
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </Field>
            <Field>
              {t("settings.email")}
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </Field>
            <Field>
              {t("settings.phoneOptional")}
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </Field>
            <Field>
              {t("settings.topicOptional")}
              <Input value={contactTopic} onChange={(e) => setContactTopic(e.target.value)} />
            </Field>
            <Field>
              {t("settings.message")}
              <Textarea value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} />
            </Field>
            {contactError ? <Muted>{t("settings.contactError")}</Muted> : null}
            <ButtonRow>
              <SecondaryButton type="button" onClick={() => setContactOpen(false)}>
                {t("settings.cancel")}
              </SecondaryButton>
              <SecondaryButton type="button" onClick={handleContactSubmit}>
                {t("settings.send")}
              </SecondaryButton>
            </ButtonRow>
          </ModalCard>
        </ModalOverlay>
      )}
    </div>
  );
}

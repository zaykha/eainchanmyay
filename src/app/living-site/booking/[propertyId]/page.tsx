"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import styled from "styled-components";
import { SiteHeader } from "@/app/living-site/components/SiteHeader";
import { BottomNav } from "@/app/living-site/components/BottomNav";
import { SectionTitle } from "@/app/living-site/components/PageSection";
import { useListingDetail } from "@/app/living-site/hooks/useListingDetail";
import { createViewingRequest } from "@/app/living-site/lib/data";
import { useI18n } from "@/app/living-site/lib/i18n";

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
  gap: 12px;
`;

const Field = styled.label`
  display: grid;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--color-muted);
`;

const Input = styled.input`
  border-radius: 10px;
  border: 1px solid var(--color-outline);
  padding: 10px 12px;
  background: var(--color-surface);
  color: var(--color-text);
  height: 40px;
`;

const Select = styled.select`
  border-radius: 10px;
  border: 1px solid var(--color-outline);
  padding: 10px 12px;
  background: var(--color-surface);
  color: var(--color-text);
  height: 40px;
`;

const Textarea = styled.textarea`
  border-radius: 10px;
  border: 1px solid var(--color-outline);
  padding: 10px 12px;
  background: var(--color-surface);
  color: var(--color-text);
  min-height: 90px;
  resize: vertical;
`;

const SubmitButton = styled.button`
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  padding: 12px 18px;
  background: var(--gradient);
  color: white;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--frame-shadow);
  transition: transform 0.15s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:active {
    transform: translate(2px, 2px);
  }
`;

const Muted = styled.p`
  margin: 0;
  color: var(--color-muted);
`;

const ErrorText = styled.p`
  margin: 0;
  color: var(--color-danger);
  font-size: 0.9rem;
  font-weight: 600;
`;

const SuccessCard = styled.div`
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
  background: color-mix(in srgb, var(--color-success) 12%, transparent);
  padding: 16px;
  display: grid;
  gap: 6px;
`;

export default function RequestViewingPage() {
  const params = useParams();
  const propertyId = params?.propertyId as string | undefined;
  const { detail, loading } = useListingDetail(propertyId);
  const { t } = useI18n();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredWindow, setPreferredWindow] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (loading) {
    return (
      <div>
        <SiteHeader />
        <PageShell>{t("booking.loadingProperty")}</PageShell>
      </div>
    );
  }

  if (!detail || !propertyId) {
    return (
      <div>
        <SiteHeader />
        <PageShell>{t("booking.notFound")}</PageShell>
      </div>
    );
  }

  const title = (detail.property.title as string) || t("listing.property");

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !preferredDate || !preferredWindow) {
      setError(t("booking.completeRequired"));
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await createViewingRequest({
      propertyId,
      name: name.trim(),
      phone: phone.trim(),
      preferredDate,
      preferredTimeWindow: preferredWindow,
      notes: notes.trim() || undefined,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message ?? t("booking.unableSubmit"));
      return;
    }

    setSuccess(true);
  };

  return (
    <div>
      <SiteHeader />
      <PageShell>
        <SectionTitle>{t("booking.requestTitle")}</SectionTitle>
        <Muted>{t("booking.subtitle")}</Muted>
        <Card>
          <strong>{title}</strong>
          <Field>
            {t("booking.nameLabel")}
            <Input
              type="text"
              placeholder={t("booking.namePlaceholder")}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field>
            {t("booking.phoneLabel")}
            <Input
              type="tel"
              placeholder={t("booking.phonePlaceholder")}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </Field>
          <Field>
            {t("booking.preferredDate")}
            <Input
              type="date"
              value={preferredDate}
              onChange={(event) => setPreferredDate(event.target.value)}
            />
          </Field>
          <Field>
            {t("booking.timeWindow")}
            <Select
              value={preferredWindow}
              onChange={(event) => setPreferredWindow(event.target.value)}
            >
              <option value="">{t("booking.timeWindowPlaceholder")}</option>
              <option value="morning">{t("booking.timeWindow.morning")}</option>
              <option value="afternoon">{t("booking.timeWindow.afternoon")}</option>
              <option value="evening">{t("booking.timeWindow.evening")}</option>
            </Select>
          </Field>
          <Field>
            {t("booking.notesOptional")}
            <Textarea
              placeholder={t("booking.notesPlaceholder")}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>
          {error && <ErrorText>{error}</ErrorText>}
          {success ? (
            <SuccessCard>
              <strong>{t("booking.requestSent")}</strong>
              <Muted>{t("booking.confirmByPhone")}</Muted>
            </SuccessCard>
          ) : (
            <SubmitButton type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? t("booking.submitting") : t("booking.submitRequest")}
            </SubmitButton>
          )}
        </Card>
      </PageShell>
      <BottomNav />
    </div>
  );
}

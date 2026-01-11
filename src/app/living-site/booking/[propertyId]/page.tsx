"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import styled from "styled-components";
import { SiteHeader } from "@/app/living-site/components/SiteHeader";
import { BottomNav } from "@/app/living-site/components/BottomNav";
import { SectionTitle } from "@/app/living-site/components/PageSection";
import { useListingDetail } from "@/app/living-site/hooks/useListingDetail";
import { createViewingRequest } from "@/app/living-site/lib/data";

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
        <PageShell>Loading property...</PageShell>
      </div>
    );
  }

  if (!detail || !propertyId) {
    return (
      <div>
        <SiteHeader />
        <PageShell>Property not found.</PageShell>
      </div>
    );
  }

  const title = (detail.property.title as string) || "Property";

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !preferredDate || !preferredWindow) {
      setError("Please complete all required fields.");
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
      setError(result.message ?? "Unable to submit your request.");
      return;
    }

    setSuccess(true);
  };

  return (
    <div>
      <SiteHeader />
      <PageShell>
        <SectionTitle>Request viewing</SectionTitle>
        <Muted>Best for users who want to propose a time.</Muted>
        <Card>
          <strong>{title}</strong>
          <Field>
            Name
            <Input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field>
            Phone
            <Input
              type="tel"
              placeholder="09-000-000-000"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </Field>
          <Field>
            Preferred date
            <Input
              type="date"
              value={preferredDate}
              onChange={(event) => setPreferredDate(event.target.value)}
            />
          </Field>
          <Field>
            Preferred time window
            <Select
              value={preferredWindow}
              onChange={(event) => setPreferredWindow(event.target.value)}
            >
              <option value="">Select a time window</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </Select>
          </Field>
          <Field>
            Notes (optional)
            <Textarea
              placeholder="Add parking needs, gate access, or any notes."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>
          {error && <ErrorText>{error}</ErrorText>}
          {success ? (
            <SuccessCard>
              <strong>Request sent</strong>
              <Muted>We’ll confirm by phone.</Muted>
            </SuccessCard>
          ) : (
            <SubmitButton type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit request"}
            </SubmitButton>
          )}
        </Card>
      </PageShell>
      <BottomNav />
    </div>
  );
}

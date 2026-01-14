"use client";

import styled from "styled-components";

export const PageSection = styled.section`
  padding: 16px;
  max-width: 1020px;
  margin: 0 auto;
  display: grid;
  gap: 12px;
`;

export const SectionTitle = styled.h2`
  margin: 0 0 2px;
  font-size: 1.6rem;

  @media (max-width: 600px) {
    font-size: 1.1rem;
  }
`;

export const Panel = styled.div`
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-soft);

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: var(--frame-shadow);
    pointer-events: none;
  }
`;

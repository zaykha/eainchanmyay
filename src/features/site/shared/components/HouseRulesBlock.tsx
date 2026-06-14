"use client";

import styled from "styled-components";

const Block = styled.div`
  position: relative;
  border-left: 3px solid var(--color-primary);
  padding: 12px 16px;
  color: var(--color-muted);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-outline);
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

type HouseRulesBlockProps = {
  rules: string[];
};

export function HouseRulesBlock({ rules }: HouseRulesBlockProps) {
  if (!rules.length) {
    return <p>No house rules provided.</p>;
  }

  return (
    <Block>
      <ul>
        {rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </Block>
  );
}

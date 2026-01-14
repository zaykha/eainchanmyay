"use client";

import styled, { keyframes } from "styled-components";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--color-paper) 45%, transparent);
  display: grid;
  place-items: center;
  z-index: 70;
  padding: 16px;
`;

const Message = styled.p`
  margin: 0;
  color: var(--color-text);
  font-weight: 600;
`;

const softBreath = keyframes`
  0% {
    transform: translateY(0) scale(1);
    filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.18));
  }
  50% {
    transform: translateY(-4px) scale(1.02);
    filter: drop-shadow(0 16px 22px rgba(0, 0, 0, 0.28));
  }
  100% {
    transform: translateY(0) scale(1);
    filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.18));
  }
`;

const Logo = styled.img`
  width: 150px;
  height: 150px;
  animation: ${softBreath} 1.8s ease-in-out infinite;
`;

type LoadingOverlayProps = {
  message?: string | null;
};

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <Overlay>
      <div style={{ display: "grid", gap: "10px", justifyItems: "center" }}>
        <Logo src="/KTLogo.png" alt="Eain Chan Myay" />
        {message ? <Message>{message}</Message> : null}
      </div>
    </Overlay>
  );
}

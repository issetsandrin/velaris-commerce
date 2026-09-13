"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./GoogleSignInButton.module.css";

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

interface GoogleSignInButtonProps {
  text?: "signin_with" | "signup_with" | "continue_with";
  onCredential: (credential: string) => void;
  disabled?: boolean;
}

/**
 * Botão oficial do Google Identity Services. Sem Client ID configurado, mostra
 * um botão desativado com a explicação, para a tela continuar completa.
 */
export function GoogleSignInButton({ text = "continue_with", onCredential, disabled }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [rendered, setRendered] = useState(false);
  const callbackRef = useRef(onCredential);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  const render = useCallback(() => {
    const google = window.google;
    const container = containerRef.current;
    if (!google || !container || !GOOGLE_CLIENT_ID) return;
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => callbackRef.current(response.credential),
      cancel_on_tap_outside: true,
      itp_support: true,
    });
    container.innerHTML = "";
    google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text,
      shape: "rectangular",
      logo_alignment: "center",
      width: Math.min(400, Math.max(200, container.clientWidth || 360)),
      locale: "pt-BR",
    });
    setRendered(true);
  }, [text]);

  useEffect(() => {
    if (scriptReady || window.google) render();
  }, [scriptReady, render]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className={styles.wrap}>
        <button type="button" className={styles.placeholder} disabled aria-describedby="google-nao-configurado">
          <GoogleGlyph />
          Continuar com Google
        </button>
        <p id="google-nao-configurado" className={styles.note}>
          Login com Google ainda não configurado. Defina <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> no
          front e <code>GOOGLE_CLIENT_ID</code> na API.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrap} data-disabled={disabled || undefined}>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <div ref={containerRef} className={styles.google} aria-busy={!rendered} />
      {!rendered && (
        <button type="button" className={styles.placeholder} disabled>
          <GoogleGlyph />
          Carregando Google…
        </button>
      )}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.5 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.4 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.5-5.8c-2.1 1.4-4.8 2.3-8.1 2.3-6.3 0-11.6-3.9-13.5-9.4l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}
